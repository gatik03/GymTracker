from django.urls import path
from rest_framework.routers import DefaultRouter

from .analytics import (
    BodyWeightRateView,
    BodyWeightTrendView,
    DailyVolumeView,
    Estimated1RMView,
    ExerciseProgressView,
    MonthlyVolumeView,
    PersonalRecordsView,
    TotalVolumeView,
    VolumePerExerciseView,
    VolumePerMuscleGroupView,
    WeeklyVolumeView,
)
from .views import (
    BodyWeightEntryViewSet,
    CustomExerciseCreateView,
    CustomExerciseDetailView,
    ExerciseSetViewSet,
    ExerciseViewSet,
    JournalEntryViewSet,
    WorkoutSessionViewSet,
)

router = DefaultRouter()
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'workout-sessions', WorkoutSessionViewSet, basename='workout-session')
router.register(r'exercise-sets', ExerciseSetViewSet, basename='exercise-set')
router.register(r'bodyweight', BodyWeightEntryViewSet, basename='bodyweight')
router.register(r'journal', JournalEntryViewSet, basename='journal-entry')

urlpatterns = [
    path('exercises/custom/', CustomExerciseCreateView.as_view(), name='custom-exercise-create'),
    path('exercises/custom/<int:pk>/', CustomExerciseDetailView.as_view(), name='custom-exercise-detail'),
]
urlpatterns += router.urls
urlpatterns += [
    path('analytics/total-volume/', TotalVolumeView.as_view(), name='total-volume'),
    path('analytics/exercise-progress/<int:exercise_id>/', ExerciseProgressView.as_view(), name='exercise-progress'),
    path('analytics/prs/', PersonalRecordsView.as_view(), name='prs'),
    path('analytics/volume-per-exercise/', VolumePerExerciseView.as_view(), name='volume-per-exercise'),
    path('analytics/volume-per-muscle-group/', VolumePerMuscleGroupView.as_view(), name='volume-per-muscle-group'),
    path('analytics/weekly-volume/', WeeklyVolumeView.as_view(), name='weekly-volume'),
    path("analytics/daily-volume/", DailyVolumeView.as_view(), name="daily-volume"),
    path('analytics/monthly-volume/', MonthlyVolumeView.as_view(), name='monthly-volume'),
    path('analytics/estimated-1rm/<int:exercise_id>/', Estimated1RMView.as_view(), name='estimated-1rm'),
    path('analytics/bodyweight/trend/', BodyWeightTrendView.as_view(), name='bodyweight-trend'),
    path('analytics/bodyweight/rate/', BodyWeightRateView.as_view(), name='bodyweight-rate'),
]
