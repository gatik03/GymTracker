from django.contrib import admin
from django.urls import include, path

from config.health import HealthView, ReadinessView
from workouts.account_views import (
    EmailVerificationConfirmView,
    EmailVerificationRequestView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegistrationView,
)
from workouts.oauth_views import OAuthCallbackView, OAuthConnectionsView, OAuthStartView
from workouts.auth_views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CsrfCookieView,
    LogoutView,
    SessionView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("workouts.urls")),
    path("api/auth/csrf/", CsrfCookieView.as_view(), name="auth-csrf"),
    path("api/auth/login/", CookieTokenObtainPairView.as_view(), name="auth-login"),
    path("api/auth/register/", RegistrationView.as_view(), name="auth-register"),
    path("api/auth/verify-email/request/", EmailVerificationRequestView.as_view(), name="auth-verify-email-request"),
    path("api/auth/verify-email/confirm/", EmailVerificationConfirmView.as_view(), name="auth-verify-email-confirm"),
    path("api/auth/password-reset/request/", PasswordResetRequestView.as_view(), name="auth-password-reset-request"),
    path("api/auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("api/auth/refresh/", CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/auth/session/", SessionView.as_view(), name="auth-session"),
    path("api/auth/oauth/connections/", OAuthConnectionsView.as_view(), name="oauth-connections"),
    path("api/auth/oauth/<str:provider>/start/", OAuthStartView.as_view(), name="oauth-start"),
    path("api/auth/oauth/<str:provider>/callback/", OAuthCallbackView.as_view(), name="oauth-callback"),
    path("api/token/", CookieTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/ready/", ReadinessView.as_view(), name="readiness"),
]
