from django.db import models
from django.contrib.auth.models import User


class Exercise(models.Model):

    MUSCLE_GROUP_CHOICES = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('legs', 'Legs'),
        ('shoulders', 'Shoulders'),
        ('forearms', 'Forearms'),
        ('triceps','Triceps'),
        ('biceps','Biceps'),
        ('core', 'Core'),
    ]

    name = models.CharField(max_length=100)

    muscle_group = models.CharField(
        max_length=20,
        choices=MUSCLE_GROUP_CHOICES
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class WorkoutSession(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.date}"


class ExerciseSet(models.Model):

    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name='sets'
    )

    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE
    )

    set_number = models.PositiveIntegerField()

    weight = models.FloatField()

    reps = models.PositiveIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.exercise.name} - {self.weight}kg x {self.reps}"

# Create your models here.
