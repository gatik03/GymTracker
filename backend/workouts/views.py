from rest_framework import viewsets

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

    queryset = Exercise.objects.all()

    serializer_class = ExerciseSerializer


class WorkoutSessionViewSet(viewsets.ModelViewSet):

    queryset = WorkoutSession.objects.all()

    serializer_class = WorkoutSessionSerializer


class ExerciseSetViewSet(viewsets.ModelViewSet):

    queryset = ExerciseSet.objects.all()

    serializer_class = ExerciseSetSerializer
