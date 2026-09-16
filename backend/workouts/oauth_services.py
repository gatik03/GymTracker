from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


class OAuthProviderError(Exception):
    pass


@dataclass(frozen=True)
class OAuthProviderProfile:
    subject: str
    email: str
    username_hint: str


PROVIDERS = {
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "openid email profile",
    },
    "github": {
        "authorize_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "scope": "read:user user:email",
    },
}


def provider_credentials(provider: str) -> tuple[str, str, str]:
    if provider == "google":
        return settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET, settings.GOOGLE_REDIRECT_URI
    if provider == "github":
        return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET, settings.GITHUB_REDIRECT_URI
    raise OAuthProviderError("Unsupported OAuth provider.")


def authorization_url(provider: str, state: str) -> str:
    config = PROVIDERS.get(provider)
    if not config:
        raise OAuthProviderError("Unsupported OAuth provider.")
    client_id, client_secret, redirect_uri = provider_credentials(provider)
    if not all([client_id, client_secret, redirect_uri]):
        raise OAuthProviderError("OAuth provider is not configured.")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": config["scope"],
        "state": state,
    }
    if provider == "google":
        params.update({"access_type": "online", "prompt": "select_account"})
    authorize_endpoint = config["authorize_url"]
    return f"{authorize_endpoint}?{urlencode(params)}"


def _json_request(url: str, *, data: dict | None = None, token: str | None = None) -> object:
    body = urlencode(data).encode("utf-8") if data is not None else None
    headers = {
        "Accept": "application/json",
        "User-Agent": "GymTracker OAuth",
    }
    if data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, data=body, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urlopen(request, timeout=10) as response:
            raw = response.read(1_000_001)
    except (HTTPError, URLError, TimeoutError) as error:
        raise OAuthProviderError("OAuth provider request failed.") from error
    if len(raw) > 1_000_000:
        raise OAuthProviderError("OAuth provider response was too large.")
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise OAuthProviderError("OAuth provider returned an invalid response.") from error


def fetch_oauth_profile(provider: str, code: str) -> OAuthProviderProfile:
    config = PROVIDERS.get(provider)
    if not config:
        raise OAuthProviderError("Unsupported OAuth provider.")
    client_id, client_secret, redirect_uri = provider_credentials(provider)
    token_data = _json_request(
        config["token_url"],
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    if not isinstance(token_data, dict) or not isinstance(token_data.get("access_token"), str):
        raise OAuthProviderError("OAuth token exchange failed.")
    token = token_data["access_token"]

    if provider == "google":
        profile = _json_request("https://openidconnect.googleapis.com/v1/userinfo", token=token)
        if not isinstance(profile, dict):
            raise OAuthProviderError("Google profile response was invalid.")
        if profile.get("email_verified") is not True:
            raise OAuthProviderError("Google email is not verified.")
        subject = profile.get("sub")
        email = profile.get("email")
        username_hint = profile.get("given_name") or (email.split("@", 1)[0] if isinstance(email, str) else "athlete")
    else:
        profile = _json_request("https://api.github.com/user", token=token)
        emails = _json_request("https://api.github.com/user/emails", token=token)
        if not isinstance(profile, dict) or not isinstance(emails, list):
            raise OAuthProviderError("GitHub profile response was invalid.")
        verified = [item for item in emails if isinstance(item, dict) and item.get("verified") and item.get("email")]
        primary = next((item for item in verified if item.get("primary")), verified[0] if verified else None)
        if primary is None:
            raise OAuthProviderError("GitHub did not provide a verified email.")
        subject = str(profile.get("id", ""))
        email = primary["email"]
        username_hint = profile.get("login") or email.split("@", 1)[0]

    if not subject or not isinstance(email, str) or "@" not in email:
        raise OAuthProviderError("OAuth provider did not return a usable identity.")
    return OAuthProviderProfile(subject=str(subject), email=email.strip().casefold(), username_hint=str(username_hint))
