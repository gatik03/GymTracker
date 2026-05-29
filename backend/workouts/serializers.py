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

        read_only_fields = [
            'created_by',
            'created_at',
        ]


class ExerciseSetSerializer(serializers.ModelSerializer):

    class Meta:
        model = ExerciseSet

        fields = '__all__'

        read_only_fields = [
            'created_at',
        ]


class WorkoutSessionSerializer(serializers.ModelSerializer):

    sets = ExerciseSetSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = WorkoutSession

        fields = '__all__'

        read_only_fields = [
            'user',
            'created_at',
        ]
