from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import (
    Exercise,
    WorkoutSession,
    ExerciseSet
)

from .serializers import (
    ExerciseSerializer,
    WorkoutSessionSerializer,
    ExerciseSetSerializer
)


class ExerciseViewSet(viewsets.ModelViewSet):

    serializer_class = ExerciseSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Exercise.objects.filter(
            created_by=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user
        )


class WorkoutSessionViewSet(viewsets.ModelViewSet):

    serializer_class = WorkoutSessionSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )


class ExerciseSetViewSet(viewsets.ModelViewSet):

    serializer_class = ExerciseSetSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(
            workout_session__user=self.request.user
        )
