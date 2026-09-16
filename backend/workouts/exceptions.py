import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("workouts")


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response

    request = context.get("request")
    logger.exception(
        "Unhandled API exception method=%s path=%s user_id=%s",
        getattr(request, "method", "unknown"),
        getattr(request, "path", "unknown"),
        getattr(getattr(request, "user", None), "id", None),
        exc_info=exc,
    )
    return Response(
        {"detail": "Something went wrong. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
