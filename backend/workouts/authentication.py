from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Use HttpOnly access cookies for browsers and Bearer tokens for trusted clients."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)

        raw_token = request.COOKIES.get(self._access_cookie_name())
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token.encode())
        SessionAuthentication().enforce_csrf(request)
        return self.get_user(validated_token), validated_token

    @staticmethod
    def _access_cookie_name():
        from django.conf import settings

        return settings.JWT_ACCESS_COOKIE
