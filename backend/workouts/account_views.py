import logging

from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .account_serializers import (
    CodeSerializer,
    IdentifierSerializer,
    PasswordResetConfirmSerializer,
    RegistrationSerializer,
)
from .account_services import (
    consume_action_code,
    ensure_account_profile,
    find_user,
    issue_action_code,
    revoke_user_refresh_tokens,
    send_action_email,
    user_payload,
)
from .auth_views import _clear_auth_cookies, _enforce_csrf, _set_auth_cookies
from .models import AccountActionCode

logger = logging.getLogger(__name__)


class PublicCsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"

    def enforce_csrf(self, request):
        _enforce_csrf(request)


class RegistrationView(PublicCsrfView):
    def post(self, request):
        self.enforce_csrf(request)
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=data["username"],
                    email=data["email"],
                    password=data["password"],
                    is_active=False,
                )
                ensure_account_profile(user)
                code = issue_action_code(user, AccountActionCode.Purpose.VERIFY_EMAIL)
        except IntegrityError:
            return Response(
                {"detail": "An account could not be created with those details."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            send_action_email(user, AccountActionCode.Purpose.VERIFY_EMAIL, code)
        except Exception:
            logger.exception("Verification email delivery failed user_id=%s", user.pk)
            return Response(
                {"detail": "Account created, but the verification email could not be sent. Try requesting a new code."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"detail": "Account created. Check your email for the six-digit verification code."},
            status=status.HTTP_201_CREATED,
        )


class EmailVerificationRequestView(PublicCsrfView):
    throttle_scope = "email_verification"

    def post(self, request):
        self.enforce_csrf(request)
        serializer = IdentifierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user(serializer.validated_data["identifier"])
        if user and not user.is_active and user.email:
            code = issue_action_code(user, AccountActionCode.Purpose.VERIFY_EMAIL)
            try:
                send_action_email(user, AccountActionCode.Purpose.VERIFY_EMAIL, code)
            except Exception:
                logger.exception("Verification email delivery failed user_id=%s", user.pk)
        return Response({"detail": "If verification is available, a new code has been sent."})


class EmailVerificationConfirmView(PublicCsrfView):
    throttle_scope = "email_verification"

    def post(self, request):
        self.enforce_csrf(request)
        serializer = CodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user(serializer.validated_data["identifier"])
        valid = bool(user) and consume_action_code(
            user,
            AccountActionCode.Purpose.VERIFY_EMAIL,
            serializer.validated_data["code"],
        )
        if not valid:
            return Response(
                {"detail": "That verification code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = True
        user.save(update_fields=["is_active"])
        ensure_account_profile(user, verified=True)
        refresh = RefreshToken.for_user(user)
        response = Response({"user": user_payload(user)})
        _set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class PasswordResetRequestView(PublicCsrfView):
    throttle_scope = "password_reset"

    def post(self, request):
        self.enforce_csrf(request)
        serializer = IdentifierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user(serializer.validated_data["identifier"])
        if user and user.is_active and user.email:
            code = issue_action_code(user, AccountActionCode.Purpose.RESET_PASSWORD)
            try:
                send_action_email(user, AccountActionCode.Purpose.RESET_PASSWORD, code)
            except Exception:
                logger.exception("Password reset email delivery failed user_id=%s", user.pk)
        return Response({"detail": "If an eligible account exists, a reset code has been sent."})


class PasswordResetConfirmView(PublicCsrfView):
    throttle_scope = "password_reset"

    def post(self, request):
        self.enforce_csrf(request)
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = find_user(serializer.validated_data["identifier"])
        valid = bool(user and user.is_active) and consume_action_code(
            user,
            AccountActionCode.Purpose.RESET_PASSWORD,
            serializer.validated_data["code"],
        )
        if not valid:
            return Response(
                {"detail": "That reset code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        revoke_user_refresh_tokens(user)
        response = Response({"detail": "Your password has been reset. Sign in with the new password."})
        _clear_auth_cookies(response)
        return response
