from __future__ import annotations

import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.crypto import salted_hmac
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import AccountActionCode, AccountProfile

logger = logging.getLogger(__name__)


def normalize_email(value: str) -> str:
    return value.strip().casefold()


def user_payload(user: User) -> dict:
    profile = getattr(user, "account_profile", None)
    return {
        "id": user.id,
        "username": user.get_username(),
        "email": user.email,
        "email_verified": bool(profile and profile.email_verified_at),
    }


def ensure_account_profile(user: User, *, verified: bool = False) -> AccountProfile:
    normalized = normalize_email(user.email) if user.email else None
    defaults = {
        "normalized_email": normalized,
        "email_verified_at": timezone.now() if verified else None,
    }
    try:
        profile, created = AccountProfile.objects.get_or_create(user=user, defaults=defaults)
    except IntegrityError:
        profile = AccountProfile.objects.get(user=user)
        created = False
    changed = []
    if normalized and profile.normalized_email != normalized:
        profile.normalized_email = normalized
        changed.append("normalized_email")
    if verified and profile.email_verified_at is None:
        profile.email_verified_at = timezone.now()
        changed.append("email_verified_at")
    if changed:
        profile.save(update_fields=[*changed, "updated_at"])
    return profile


def find_user(identifier: str) -> User | None:
    identifier = identifier.strip()
    if "@" in identifier:
        email_matches = list(User.objects.filter(email__iexact=normalize_email(identifier))[:2])
        if len(email_matches) == 1:
            return email_matches[0]
    username = User.objects.filter(username__iexact=identifier).first()
    if username:
        return username
    email_matches = list(User.objects.filter(email__iexact=normalize_email(identifier))[:2])
    return email_matches[0] if len(email_matches) == 1 else None


def _code_digest(user: User, purpose: str, code: str) -> str:
    return salted_hmac(
        "gymtracker.account-action-code",
        f"{user.pk}:{purpose}:{code}",
        secret=settings.SECRET_KEY,
        algorithm="sha256",
    ).hexdigest()


def issue_action_code(user: User, purpose: str) -> str:
    code = f"{secrets.randbelow(1_000_000):06d}"
    if purpose == AccountActionCode.Purpose.VERIFY_EMAIL:
        expires_at = timezone.now() + timedelta(hours=settings.EMAIL_VERIFICATION_CODE_HOURS)
    else:
        expires_at = timezone.now() + timedelta(minutes=settings.PASSWORD_RESET_CODE_MINUTES)

    with transaction.atomic():
        AccountActionCode.objects.filter(
            user=user,
            purpose=purpose,
            consumed_at__isnull=True,
        ).update(consumed_at=timezone.now())
        AccountActionCode.objects.create(
            user=user,
            purpose=purpose,
            code_digest=_code_digest(user, purpose, code),
            expires_at=expires_at,
        )
    return code


def consume_action_code(user: User, purpose: str, code: str) -> bool:
    digest = _code_digest(user, purpose, code)
    with transaction.atomic():
        action_code = AccountActionCode.objects.select_for_update().filter(
            user=user,
            purpose=purpose,
            code_digest=digest,
            consumed_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()
        if action_code is None:
            return False
        action_code.consumed_at = timezone.now()
        action_code.save(update_fields=["consumed_at"])
    return True


def send_action_email(user: User, purpose: str, code: str) -> None:
    if purpose == AccountActionCode.Purpose.VERIFY_EMAIL:
        subject = "Verify your GymTracker email"
        body = (
            f"Your GymTracker verification code is {code}. "
            f"It expires in {settings.EMAIL_VERIFICATION_CODE_HOURS} hours. "
            "If you did not create this account, you can ignore this message."
        )
    else:
        subject = "Reset your GymTracker password"
        body = (
            f"Your GymTracker password reset code is {code}. "
            f"It expires in {settings.PASSWORD_RESET_CODE_MINUTES} minutes. "
            "If you did not request this reset, you can ignore this message."
        )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    logger.info("Account action email sent purpose=%s user_id=%s", purpose, user.pk)


def revoke_user_refresh_tokens(user: User) -> None:
    outstanding = OutstandingToken.objects.filter(user=user)
    for token in outstanding.iterator():
        BlacklistedToken.objects.get_or_create(token=token)
