from rest_framework import serializers
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
