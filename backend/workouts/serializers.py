from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import (
    BodyWeightEntry,
    Exercise,
    ExerciseSet,
    FavoriteExercise,
    WorkoutSession,
    JournalEntry,
)


class ExerciseSerializer(serializers.ModelSerializer):
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = Exercise
        fields = [
            'id',
            'name',
            'muscle_group',
            'equipment',
            'difficulty',
            'exercise_type',
            'is_custom',
            'created_by',
            'created_at',
            'is_favorite',
        ]
        read_only_fields = [
            'is_custom',
            'created_by',
            'created_at',
            'is_favorite',
        ]


class CustomExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            'id',
            'name',
            'muscle_group',
            'equipment',
            'difficulty',
            'exercise_type',
            'is_custom',
            'created_by',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'is_custom',
            'created_by',
            'created_at',
        ]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Exercise name cannot be empty.")
        request = self.context['request']
        queryset = Exercise.objects.filter(
            created_by=request.user,
            is_custom=True,
            name__iexact=value,
        )
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                'You already created a custom exercise with this name.'
            )
        return value

    def create(self, validated_data):
        validated_data['is_custom'] = True
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExerciseSetSerializer(serializers.ModelSerializer):
    rpe = serializers.FloatField(min_value=1, max_value=10, allow_null=True, required=False)
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    exercise_muscle_group = serializers.CharField(
        source='exercise.muscle_group',
        read_only=True,
    )

    class Meta:
        model = ExerciseSet
        fields = [
            'id',
            'workout_session',
            'exercise',
            'exercise_name',
            'exercise_muscle_group',
            'set_number',
            'weight',
            'reps',
            'rpe',
            'rir',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'created_at',
            'exercise_name',
            'exercise_muscle_group',
        ]
        extra_kwargs = {
            'set_number': {'min_value': 1, 'max_value': 1000},
            'weight': {'min_value': 0, 'max_value': 2000},
            'reps': {'min_value': 1, 'max_value': 1000},
            'rir': {'min_value': 0, 'max_value': 10, 'allow_null': True, 'required': False},
            'notes': {'max_length': 500, 'required': False},
        }

    def validate(self, attrs):
        request = self.context['request']
        workout_session = attrs.get('workout_session', getattr(self.instance, 'workout_session', None))
        exercise = attrs.get('exercise', getattr(self.instance, 'exercise', None))

        if workout_session and workout_session.user_id != request.user.id:
            raise serializers.ValidationError(
                {'workout_session': 'You can only log sets to your own workout sessions.'}
            )

        if workout_session and workout_session.status == WorkoutSession.Status.COMPLETED:
            raise serializers.ValidationError(
                {"workout_session": "Completed workouts cannot be changed."}
            )

        if exercise is not None:
            is_accessible = (
                (not exercise.is_custom and exercise.created_by_id is None) or
                (exercise.is_custom and exercise.created_by_id == request.user.id)
            )
            if not is_accessible:
                raise serializers.ValidationError(
                    {'exercise': 'You can only use built-in exercises or your own custom exercises.'}
                )

        return attrs


class WorkoutSessionSerializer(serializers.ModelSerializer):
    sets = ExerciseSetSerializer(many=True, read_only=True)
    exercise_count = serializers.SerializerMethodField()
    total_sets = serializers.SerializerMethodField()
    total_volume = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = [
            'id',
            'title',
            'workout_type',
            'date',
            'notes',
            'status',
            'started_at',
            'completed_at',
            'created_at',
            'updated_at',
            'sets',
            'exercise_count',
            'total_sets',
            'total_volume',
            'duration_minutes',
        ]
        read_only_fields = [
            'status',
            'started_at',
            'completed_at',
            'created_at',
            'updated_at',
            'sets',
            'exercise_count',
            'total_sets',
            'total_volume',
            'duration_minutes',
        ]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Workout title cannot be empty.')
        return value

    def get_exercise_count(self, obj):
        return len({workout_set.exercise_id for workout_set in obj.sets.all()})

    def get_total_sets(self, obj):
        return len(obj.sets.all())

    def get_total_volume(self, obj):
        return round(sum(workout_set.weight * workout_set.reps for workout_set in obj.sets.all()), 2)

    def get_duration_minutes(self, obj):
        end = obj.completed_at or timezone.now()
        return max(0, round((end - obj.started_at).total_seconds() / 60))


class BodyWeightEntrySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = BodyWeightEntry
        fields = '__all__'
        read_only_fields = [
            'created_at',
        ]
        extra_kwargs = {
            'weight': {'min_value': 20, 'max_value': 500},
        }
        validators = [
            UniqueTogetherValidator(
                queryset=BodyWeightEntry.objects.all(),
                fields=['user', 'date'],
                message='A weight entry for this date already exists.'
            )
        ]


class FavoriteExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)

    class Meta:
        model = FavoriteExercise
        fields = ['id', 'created_at', 'exercise']
        read_only_fields = fields


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ["id", "date", "title", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value):
        return value.strip()

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Write something before saving this entry.")
        return value
