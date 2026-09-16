from __future__ import annotations

import json
from pathlib import Path

from django.db.models import Count, Exists, Max, OuterRef, Q, QuerySet

from workouts.data.exercises import EXERCISE_LIBRARY
from workouts.models import Exercise, FavoriteExercise, WorkoutSession

ALLOWED_ORDERING_FIELDS = {
    'name': 'name',
    '-name': '-name',
    'created_at': 'created_at',
    '-created_at': '-created_at',
    'difficulty': 'difficulty',
    '-difficulty': '-difficulty',
}


def accessible_exercises_queryset(user) -> QuerySet[Exercise]:
    favorite_subquery = FavoriteExercise.objects.filter(
        user=user,
        exercise_id=OuterRef('pk'),
    )
    return Exercise.objects.filter(
        Q(is_custom=False) |
        Q(created_by=user, is_custom=True)
    ).annotate(
        is_favorite=Exists(favorite_subquery)
    )


def apply_exercise_filters(queryset: QuerySet[Exercise], params) -> QuerySet[Exercise]:
    search = (params.get('search') or params.get('q') or '').strip()
    muscle_group = (params.get('muscle_group') or '').strip()
    equipment = (params.get('equipment') or '').strip()
    difficulty = (params.get('difficulty') or '').strip()
    exercise_type = (params.get('exercise_type') or '').strip()
    favorites_only = (params.get('favorites') or '').lower() in {'1', 'true', 'yes'}
    built_in_only = (params.get('built_in_only') or '').lower() in {'1', 'true', 'yes'}
    custom_only = (params.get('custom_only') or '').lower() in {'1', 'true', 'yes'}
    ordering = params.get('ordering') or 'name'

    if search:
        queryset = queryset.filter(name__icontains=search)
    if muscle_group:
        queryset = queryset.filter(muscle_group=muscle_group)
    if equipment:
        queryset = queryset.filter(equipment=equipment)
    if difficulty:
        queryset = queryset.filter(difficulty=difficulty)
    if exercise_type:
        queryset = queryset.filter(exercise_type=exercise_type)
    if favorites_only:
        queryset = queryset.filter(is_favorite=True)
    if built_in_only:
        queryset = queryset.filter(is_custom=False)
    if custom_only:
        queryset = queryset.filter(is_custom=True)

    return queryset.order_by(ALLOWED_ORDERING_FIELDS.get(ordering, 'name'), 'id')


def muscle_group_counts(queryset: QuerySet[Exercise]):
    return queryset.values('muscle_group').annotate(count=Count('id')).order_by('muscle_group')


def recent_exercises_queryset(user) -> QuerySet[Exercise]:
    return accessible_exercises_queryset(user).filter(
        exerciseset__workout_session__user=user,
        exerciseset__workout_session__status=WorkoutSession.Status.COMPLETED,
    ).annotate(
        last_used_at=Max('exerciseset__workout_session__date')
    ).order_by('-last_used_at', 'name')


def load_builtin_exercise_records():
    return list(EXERCISE_LIBRARY)


# Future import path support can reuse the same normalization pathway.
def load_exercise_records_from_json(path: str | Path):
    with open(path, 'r', encoding='utf-8') as exercise_file:
        return json.load(exercise_file)
