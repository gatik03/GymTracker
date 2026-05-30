from rest_framework.routers import DefaultRouter
from .analytics import TotalVolumeView
from django.urls import path
from .views import (
    ExerciseViewSet,
    WorkoutSessionViewSet,
    ExerciseSetViewSet
)


router = DefaultRouter()

router.register(
    r'exercises',
    ExerciseViewSet,
    basename='exercise'
)

router.register(
    r'workout-sessions',
    WorkoutSessionViewSet,
    basename='workout-session'
)

router.register(
    r'exercise-sets',
    ExerciseSetViewSet,
    basename='exercise-set'
)

urlpatterns = router.urls
urlpatterns += [
    path(
        'analytics/total-volume/',
        TotalVolumeView.as_view(),
        name='total-volume'
    )
]
