from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .account_serializers import IdentifierTokenObtainPairSerializer
from .account_services import ensure_account_profile, user_payload


def _cookie_options(max_age):
    return {
        "max_age": max_age,
        "httponly": True,
        "secure": settings.JWT_COOKIE_SECURE,
        "samesite": settings.JWT_COOKIE_SAMESITE,
        "domain": settings.JWT_COOKIE_DOMAIN,
        "path": "/api/",
    }


def _set_auth_cookies(response, access, refresh=None):
    response.set_cookie(settings.JWT_ACCESS_COOKIE, access, **_cookie_options(settings.JWT_ACCESS_COOKIE_MAX_AGE))
    response.set_cookie(
        settings.JWT_SESSION_MARKER_COOKIE,
        "1",
        max_age=settings.JWT_REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        domain=settings.JWT_COOKIE_DOMAIN,
        path="/",
    )
    if refresh:
        response.set_cookie(settings.JWT_REFRESH_COOKIE, refresh, **_cookie_options(settings.JWT_REFRESH_COOKIE_MAX_AGE))


def _clear_auth_cookies(response):
    options = {"domain": settings.JWT_COOKIE_DOMAIN, "path": "/api/", "samesite": settings.JWT_COOKIE_SAMESITE}
    response.delete_cookie(settings.JWT_ACCESS_COOKIE, **options)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE, **options)
    response.delete_cookie(
        settings.JWT_SESSION_MARKER_COOKIE,
        domain=settings.JWT_COOKIE_DOMAIN,
        path="/",
        samesite=settings.JWT_COOKIE_SAMESITE,
    )


def _enforce_csrf(request):
    SessionAuthentication().enforce_csrf(request)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrf_token": get_token(request)})


class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = IdentifierTokenObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        _enforce_csrf(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        ensure_account_profile(user, verified=True)
        response = Response({"user": user_payload(user)})
        _set_auth_cookies(response, serializer.validated_data["access"], serializer.validated_data["refresh"])
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "refresh"

    def post(self, request, *args, **kwargs):
        _enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh:
            return Response({"detail": "Session refresh is unavailable."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        response = Response({"detail": "Session refreshed."})
        _set_auth_cookies(response, serializer.validated_data["access"], serializer.validated_data.get("refresh", refresh))
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "refresh"

    def post(self, request):
        _enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_auth_cookies(response)
        return response


class SessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_account_profile(request.user, verified=True)
        return Response({"user": user_payload(request.user)})
