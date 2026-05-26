from rest_framework import viewsets
from .models import Exercise
from .serializers import ExerciseSerializer


class ExerciseViewSet(viewsets.ModelViewSet):

    queryset = Exercise.objects.all()

    serializer_class = ExerciseSerializer

from django.shortcuts import render

# Create your views here.
