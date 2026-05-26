"""from rest_framework import serializers
from .models import Exercise, WorkoutSession, ExerciseSet


class ExerciseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Exercise

        fields = [
            'id',
            'name',
            'muscle_group',
            'created_by',
            'created_at',
        ]


class WorkoutSessionSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkoutSession

        fields = [
            'id',
            'user',
            'date',
            'notes',
            'created_at',
        ]


class ExerciseSetSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExerciseSet

        fields = [
            'id',
            'workout_session',
            'exercise',
            'set_number',
            'weight',
            'reps',
            'created_at',
        ]
"""
from rest_framework import serializers

from .models import (
    Exercise,
    WorkoutSession,
    ExerciseSet
)


class ExerciseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Exercise

        fields = '__all__'


class ExerciseSetSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExerciseSet

        fields = '__all__'


class WorkoutSessionSerializer(serializers.ModelSerializer):

    sets = ExerciseSetSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = WorkoutSession

        fields = '__all__'
