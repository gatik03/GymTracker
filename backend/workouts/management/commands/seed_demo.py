from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from workouts.account_services import ensure_account_profile
from workouts.models import BodyWeightEntry, Exercise, ExerciseSet, JournalEntry, WorkoutSession


DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@stackd.example"
# These are intentionally public credentials for an account containing only fictional data.
DEMO_PASSWORD = "StackdDemo2026!"

WORKOUTS = (
    ("push", (("Barbell Bench Press", 60), ("Standing Overhead Press", 30), ("Dumbbell Lateral Raise", 8))),
    ("pull", (("Bent-Over Barbell Row", 50), ("Lat Pulldown", 45), ("Barbell Curl", 20))),
    ("legs", (("Back Squat", 80), ("Romanian Deadlift", 60), ("Standing Calf Raise", 40))),
)


class Command(BaseCommand):
    help = "Create an isolated demo account with eight weeks of labelled sample training data."

    @transaction.atomic
    def handle(self, *args, **options):
        existing = User.objects.filter(username__iexact=DEMO_USERNAME).first()
        if existing:
            if existing.email != DEMO_EMAIL or existing.is_staff or existing.is_superuser:
                raise CommandError("The demo username is already in use. No accounts were changed.")
            # shortcut: dates stay fixed after the first seed; add an explicit demo refresh for long-lived hosted demos.
            self.stdout.write("Demo account already exists; its data and password were left unchanged.")
            return
        if User.objects.filter(email__iexact=DEMO_EMAIL).exists():
            raise CommandError("The demo email is already in use. No accounts were changed.")

        user = User.objects.create_user(DEMO_USERNAME, email=DEMO_EMAIL, password=DEMO_PASSWORD)
        ensure_account_profile(user, verified=True)
        call_command("seed_exercises", stdout=self.stdout)
        exercises = {exercise.name: exercise for exercise in Exercise.objects.filter(is_custom=False)}
        now = timezone.now()
        today = timezone.localdate(now)

        for index, days_ago in enumerate(sorted(set(range(0, 56, 3)) | {1, 2}, reverse=True)):
            workout_type, lifts = WORKOUTS[index % len(WORKOUTS)]
            completed_at = now - timedelta(days=days_ago)
            workout = WorkoutSession.objects.create(
                user=user,
                title=f"Sample: {workout_type.capitalize()} day",
                workout_type=workout_type,
                date=today - timedelta(days=days_ago),
                notes="Fictional sample workout for exploring STACKD.",
                status=WorkoutSession.Status.COMPLETED,
                started_at=completed_at - timedelta(minutes=45 + index % 15),
                completed_at=completed_at,
            )
            ExerciseSet.objects.bulk_create([
                ExerciseSet(
                    workout_session=workout,
                    exercise=exercises[name],
                    set_number=set_number,
                    weight=base_weight + (index // 3) * 2.5,
                    reps=12 - set_number * 2,
                    rpe=7 + set_number * 0.5,
                    rir=3 - set_number,
                    notes="Sample set",
                )
                for name, base_weight in lifts
                for set_number in range(1, 4)
            ])

        BodyWeightEntry.objects.bulk_create([
            BodyWeightEntry(user=user, date=today - timedelta(days=days_ago), weight=round(78 - index * 0.035, 1))
            for index, days_ago in enumerate(range(54, -1, -2))
        ])
        JournalEntry.objects.bulk_create([
            JournalEntry(
                user=user,
                date=today - timedelta(days=days_ago),
                title=f"Sample: {title}",
                content=f"Fictional demo entry. {content}",
            )
            for days_ago, title, content in (
                (12, "Training notes", "Recorded weight and reps for each working set."),
                (5, "Week in review", "Reviewed completed sessions and exercise progress."),
                (0, "Today's session", "Finished the workout and saved the session to training history."),
            )
        ])
        self.stdout.write(self.style.SUCCESS(
            f"Demo ready: 21 workouts, 189 sets, 28 weight entries and 3 journal entries. "
            f"Log in as {DEMO_USERNAME} with password {DEMO_PASSWORD}."
        ))
