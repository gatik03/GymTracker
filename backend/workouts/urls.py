from django.urls import path
from .views import ExerciseListCreateView


urlpatterns = [
    path(
        'exercises/',
        ExerciseListCreateView.as_view(),
        name='exercise-list-create'
    ),
]
