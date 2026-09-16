from __future__ import annotations

import logging
import re
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.models import User
from django.core import signing
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponseRedirect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .account_services import ensure_account_profile, normalize_email
from .auth_views import _enforce_csrf, _set_auth_cookies
from .models import OAuthIdentity
from .oauth_services import (
    OAuthProviderError,
    OAuthProviderProfile,
    PROVIDERS,
    authorization_url,
    fetch_oauth_profile,
)

logger = logging.getLogger(__name__)
STATE_SALT = "gymtracker.oauth.state"
SAFE_DESTINATIONS = {"/", "/workouts", "/analytics", "/journal", "/profile"}


def _state_cookie_name(provider: str) -> str:
    return f"gymtracker_oauth_{provider}_state"


def _state_cookie_options(provider: str) -> dict:
    return {
        "max_age": settings.OAUTH_STATE_MAX_AGE,
        "httponly": True,
        "secure": settings.JWT_COOKIE_SECURE,
        "samesite": "Lax",
        "domain": settings.JWT_COOKIE_DOMAIN,
        "path": f"/api/auth/oauth/{provider}/callback/",
    }


def _safe_destination(value: str | None) -> str:
    return value if value in SAFE_DESTINATIONS else "/"


def _frontend_redirect(destination: str, error: str | None = None) -> HttpResponseRedirect:
    path = _safe_destination(destination)
    if error:
        separator = "&" if "?" in path else "?"
        path = f"{path}{separator}{urlencode({"oauth_error": error})}"
    return HttpResponseRedirect(f"{settings.FRONTEND_URL.rstrip("/")}{path}")


def _clear_state_cookie(response: HttpResponseRedirect, provider: str) -> None:
    response.delete_cookie(
        _state_cookie_name(provider),
        domain=settings.JWT_COOKIE_DOMAIN,
        path=f"/api/auth/oauth/{provider}/callback/",
        samesite="Lax",
    )


def _unique_username(hint: str) -> str:
    base = re.sub(r"[^\w.@+-]", "", hint, flags=re.UNICODE).strip(".@+-")[:120] or "athlete"
    candidate = base
    suffix = 1
    while User.objects.filter(Q(username__iexact=candidate) | Q(email__iexact=candidate)).exists():
        suffix += 1
        candidate = f"{base[:140]}-{suffix}"
    return candidate


def _users_for_email(email: str) -> list[User]:
    normalized = normalize_email(email)
    return list(
        User.objects.filter(
            Q(email__iexact=normalized) | Q(username__iexact=normalized) | Q(account_profile__normalized_email=normalized)
        ).distinct()[:2]
    )


def _resolve_oauth_user(
    provider: str,
    profile: OAuthProviderProfile,
    link_user_id: int | None,
) -> User:
    identity = OAuthIdentity.objects.select_related("user").filter(
        provider=provider,
        subject=profile.subject,
    ).first()

    if identity:
        if link_user_id and identity.user_id != link_user_id:
            raise OAuthProviderError("That provider account is already connected elsewhere.")
        if not identity.user.is_active:
            raise OAuthProviderError("The connected account is unavailable.")
        if identity.email != profile.email:
            identity.email = profile.email
            identity.save(update_fields=["email", "updated_at"])
        return identity.user

    if link_user_id:
        target = User.objects.filter(pk=link_user_id, is_active=True).first()
        if target is None:
            raise OAuthProviderError("The account being linked is unavailable.")
        if OAuthIdentity.objects.filter(user=target, provider=provider).exists():
            raise OAuthProviderError("A different provider identity is already connected.")
        email_users = _users_for_email(profile.email)
        if email_users and any(user.pk != target.pk for user in email_users):
            raise OAuthProviderError("That provider email belongs to another account.")
        OAuthIdentity.objects.create(
            user=target,
            provider=provider,
            subject=profile.subject,
            email=profile.email,
        )
        ensure_account_profile(target, verified=normalize_email(target.email) == profile.email)
        return target

    if _users_for_email(profile.email):
        raise OAuthProviderError("An account with this email already exists. Sign in first, then connect the provider from Profile.")

    user = User(
        username=_unique_username(profile.username_hint),
        email=profile.email,
        is_active=True,
    )
    user.set_unusable_password()
    user.save()
    ensure_account_profile(user, verified=True)
    OAuthIdentity.objects.create(
        user=user,
        provider=provider,
        subject=profile.subject,
        email=profile.email,
    )
    return user


class OAuthStartView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "oauth"

    def post(self, request, provider: str):
        _enforce_csrf(request)
        if provider not in PROVIDERS:
            return Response({"detail": "Unsupported OAuth provider."}, status=status.HTTP_404_NOT_FOUND)
        destination = _safe_destination(request.data.get("next"))
        payload = {
            "provider": provider,
            "nonce": secrets.token_urlsafe(32),
            "next": destination,
            "link_user_id": request.user.pk if request.user.is_authenticated else None,
        }
        state = signing.dumps(payload, salt=STATE_SALT, compress=True)
        try:
            url = authorization_url(provider, state)
        except OAuthProviderError:
            logger.warning("OAuth start rejected because provider is not configured provider=%s", provider)
            return Response(
                {"detail": "This sign-in provider is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        response = Response({"authorization_url": url})
        response.set_cookie(_state_cookie_name(provider), state, **_state_cookie_options(provider))
        return response


class OAuthCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "oauth"

    def get(self, request, provider: str):
        if provider not in PROVIDERS:
            return _frontend_redirect("/login", "unsupported_provider")
        state = request.query_params.get("state", "")
        state_cookie = request.COOKIES.get(_state_cookie_name(provider), "")
        destination = "/login"
        try:
            if not state or not secrets.compare_digest(state, state_cookie):
                raise signing.BadSignature("OAuth state cookie mismatch.")
            payload = signing.loads(state, salt=STATE_SALT, max_age=settings.OAUTH_STATE_MAX_AGE)
            if payload.get("provider") != provider:
                raise signing.BadSignature("OAuth provider mismatch.")
            destination = _safe_destination(payload.get("next"))
        except (signing.BadSignature, signing.SignatureExpired, TypeError):
            response = _frontend_redirect("/login", "invalid_state")
            _clear_state_cookie(response, provider)
            return response

        if request.query_params.get("error"):
            response = _frontend_redirect(destination, "cancelled")
            _clear_state_cookie(response, provider)
            return response
        code = request.query_params.get("code", "")
        if not code or len(code) > 2048:
            response = _frontend_redirect(destination, "invalid_callback")
            _clear_state_cookie(response, provider)
            return response

        try:
            profile = fetch_oauth_profile(provider, code)
            with transaction.atomic():
                user = _resolve_oauth_user(provider, profile, payload.get("link_user_id"))
        except (OAuthProviderError, IntegrityError) as error:
            logger.warning("OAuth callback rejected provider=%s reason=%s", provider, type(error).__name__)
            message = str(error)
            error_code = "account_exists" if "Sign in first" in message else "oauth_failed"
            response = _frontend_redirect("/login" if error_code == "account_exists" else destination, error_code)
            _clear_state_cookie(response, provider)
            return response

        refresh = RefreshToken.for_user(user)
        response = _frontend_redirect(destination)
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        _clear_state_cookie(response, provider)
        return response


class OAuthConnectionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        providers = list(request.user.oauth_identities.order_by("provider").values_list("provider", flat=True))
        return Response({"providers": providers})
