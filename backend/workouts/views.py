from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BodyWeightEntry, Exercise, ExerciseSet, FavoriteExercise, JournalEntry, WorkoutSession
from .serializers import (
    BodyWeightEntrySerializer,
    CustomExerciseSerializer,
    ExerciseSerializer,
    ExerciseSetSerializer,
    FavoriteExerciseSerializer,
    JournalEntrySerializer,
    WorkoutSessionSerializer,
)
from .services.exercises import (
    accessible_exercises_queryset,
    apply_exercise_filters,
    muscle_group_counts,
    recent_exercises_queryset,
)


class ExercisePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ExercisePagination

    def get_queryset(self):
        queryset = accessible_exercises_queryset(self.request.user)
        return apply_exercise_filters(queryset, self.request.query_params)

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        queryset = apply_exercise_filters(
            accessible_exercises_queryset(request.user),
            request.query_params,
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='muscle-group', pagination_class=None)
    def muscle_group(self, request):
        queryset = apply_exercise_filters(
            accessible_exercises_queryset(request.user),
            request.query_params,
        )
        return Response(list(muscle_group_counts(queryset)))

    @action(detail=False, methods=['get'], url_path='favorites')
    def favorites(self, request):
        queryset = apply_exercise_filters(
            accessible_exercises_queryset(request.user).filter(is_favorite=True),
            request.query_params,
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        queryset = recent_exercises_queryset(request.user)
        try:
            limit = int(request.query_params.get('limit', 8))
        except (TypeError, ValueError):
            return Response({'limit': ['Enter a whole number between 1 and 20.']}, status=status.HTTP_400_BAD_REQUEST)
        if not 1 <= limit <= 20:
            return Response({'limit': ['Enter a whole number between 1 and 20.']}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(queryset[:limit], many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'delete'], url_path='favorite')
    def favorite(self, request, pk=None):
        exercise = self.get_object()
        if request.method == 'POST':
            favorite, created = FavoriteExercise.objects.get_or_create(
                user=request.user,
                exercise=exercise,
            )
            serializer = FavoriteExerciseSerializer(favorite, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        FavoriteExercise.objects.filter(user=request.user, exercise=exercise).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomExerciseCreateView(generics.CreateAPIView):
    serializer_class = CustomExerciseSerializer
    permission_classes = [IsAuthenticated]


class CustomExerciseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Exercise.objects.filter(created_by=self.request.user, is_custom=True)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = WorkoutSession.objects.filter(user=self.request.user).prefetch_related(
            Prefetch(
                "sets",
                queryset=ExerciseSet.objects.select_related("exercise").order_by("set_number", "id"),
            )
        )
        if self.action == "list":
            return queryset.filter(status=WorkoutSession.Status.COMPLETED)
        return queryset

    def create(self, request, *args, **kwargs):
        active = WorkoutSession.objects.filter(
            user=request.user,
            status=WorkoutSession.Status.DRAFT,
        ).first()
        if active is not None:
            return Response(
                {
                    "detail": "Finish or discard your active workout before starting another.",
                    "active_workout_id": active.pk,
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                workout = serializer.save(user=request.user)
        except IntegrityError:
            active = WorkoutSession.objects.filter(
                user=request.user,
                status=WorkoutSession.Status.DRAFT,
            ).first()
            return Response(
                {
                    "detail": "Finish or discard your active workout before starting another.",
                    "active_workout_id": active.pk if active else None,
                },
                status=status.HTTP_409_CONFLICT,
            )

        workout = self.get_queryset().get(pk=workout.pk)
        output = self.get_serializer(workout)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(output.data),
        )

    @action(detail=False, methods=["get"], url_path="active-draft")
    def active_draft(self, request):
        workout = self.get_queryset().filter(status=WorkoutSession.Status.DRAFT).first()
        if workout is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(self.get_serializer(workout).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        with transaction.atomic():
            workout = get_object_or_404(
                WorkoutSession.objects.select_for_update().filter(user=request.user),
                pk=pk,
            )
            if workout.status == WorkoutSession.Status.COMPLETED:
                return Response(
                    {"detail": "This workout has already been completed."},
                    status=status.HTTP_409_CONFLICT,
                )
            if not workout.sets.exists():
                return Response(
                    {"detail": "Add at least one set before finishing your workout."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            workout.status = WorkoutSession.Status.COMPLETED
            workout.completed_at = timezone.now()
            workout.save(update_fields=["status", "completed_at", "updated_at"])

        workout = self.get_queryset().get(pk=workout.pk)
        return Response(self.get_serializer(workout).data)


class ExerciseSetViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(
            workout_session__user=self.request.user
        ).select_related('exercise', 'workout_session')


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.workout_session.status == WorkoutSession.Status.COMPLETED:
            return Response(
                {"detail": "Completed workouts cannot be changed."},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BodyWeightEntryViewSet(viewsets.ModelViewSet):
    serializer_class = BodyWeightEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BodyWeightEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
