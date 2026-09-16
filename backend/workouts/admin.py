from django.contrib import admin

from .models import BodyWeightEntry, Exercise, ExerciseSet, FavoriteExercise, WorkoutSession


class ExerciseSetInline(admin.TabularInline):
    model = ExerciseSet
    extra = 1
    raw_id_fields = ('exercise',)


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'muscle_group',
        'equipment',
        'difficulty',
        'exercise_type',
        'is_custom',
        'created_by',
        'created_at',
    )
    list_filter = (
        'muscle_group',
        'equipment',
        'difficulty',
        'exercise_type',
        'is_custom',
        'created_at',
    )
    search_fields = (
        'name',
        'created_by__username',
    )
    raw_id_fields = ('created_by',)


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'workout_type',
        'status',
        'date',
        'user',
        'created_at',
    )
    list_filter = (
        'workout_type',
        'status',
        'date',
        'user',
    )
    search_fields = (
        'title',
        'user__username',
        'notes',
    )
    raw_id_fields = ('user',)
    inlines = [ExerciseSetInline]


@admin.register(ExerciseSet)
class ExerciseSetAdmin(admin.ModelAdmin):
    list_display = (
        'exercise',
        'workout_session',
        'set_number',
        'weight',
        'reps',
        'rpe',
        'rir',
        'created_at',
    )
    list_filter = (
        'exercise__muscle_group',
        'created_at',
    )
    search_fields = (
        'exercise__name',
        'workout_session__title',
        'workout_session__user__username',
    )
    raw_id_fields = (
        'workout_session',
        'exercise',
    )


@admin.register(BodyWeightEntry)
class BodyWeightEntryAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'weight',
        'date',
        'created_at',
    )
    list_filter = (
        'date',
        'user',
    )
    search_fields = ('user__username',)
    raw_id_fields = ('user',)


@admin.register(FavoriteExercise)
class FavoriteExerciseAdmin(admin.ModelAdmin):
    list_display = ('user', 'exercise', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'exercise__name')
    raw_id_fields = ('user', 'exercise')
