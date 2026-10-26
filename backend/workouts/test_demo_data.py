from io import StringIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone
from rest_framework.test import APITestCase

from workouts.management.commands.seed_demo import DEMO_EMAIL, DEMO_PASSWORD, DEMO_USERNAME
from workouts.models import BodyWeightEntry, ExerciseSet, JournalEntry, WorkoutSession


class DemoDataCommandTest(APITestCase):
    def seed(self):
        call_command("seed_demo", stdout=StringIO())

    def test_seed_populates_authenticated_dashboard_and_isolates_samples(self):
        self.seed()
        demo = User.objects.get(username=DEMO_USERNAME)
        self.assertFalse(demo.is_staff)
        self.assertFalse(demo.is_superuser)
        self.assertIsNotNone(demo.account_profile.email_verified_at)
        workouts = WorkoutSession.objects.filter(user=demo)
        self.assertEqual(workouts.count(), 21)
        self.assertFalse(workouts.exclude(status=WorkoutSession.Status.COMPLETED).exists())
        self.assertEqual(workouts.first().date, timezone.localdate())
        self.assertEqual(ExerciseSet.objects.filter(workout_session__user=demo).count(), 189)
        self.assertEqual(BodyWeightEntry.objects.filter(user=demo).count(), 28)
        self.assertEqual(JournalEntry.objects.filter(user=demo).count(), 3)

        login = self.client.post("/api/auth/login/", {"username": DEMO_USERNAME, "password": DEMO_PASSWORD})
        self.assertEqual(login.status_code, 200)
        volume = self.client.get("/api/analytics/total-volume/")
        self.assertEqual(volume.status_code, 200)
        self.assertGreater(volume.data["total_volume"], 0)
        self.assertEqual(len(self.client.get("/api/analytics/prs/").data), 9)
        self.assertGreater(len(self.client.get("/api/analytics/weekly-volume/").data), 1)
        self.assertIsNotNone(self.client.get("/api/analytics/bodyweight/rate/").data["total_change"])

        other = User.objects.create_user(username="private_user", password="PrivateAccount2026!")
        self.client.force_authenticate(user=other)
        for url in ("/api/workout-sessions/", "/api/bodyweight/", "/api/journal/"):
            self.assertEqual(self.client.get(url).data, [])
        self.assertEqual(self.client.get("/api/analytics/total-volume/").data["total_volume"], 0)

    def test_rerun_preserves_records_and_passwords(self):
        other = User.objects.create_user(username="private_user", password="PrivateAccount2026!")
        private_workout = WorkoutSession.objects.create(user=other, title="My workout", date=timezone.localdate())
        self.seed()
        demo = User.objects.get(username=DEMO_USERNAME)
        demo.set_password("ChangedDemoPassword2026!")
        demo.save(update_fields=["password"])
        password_hash = demo.password
        self.seed()
        demo.refresh_from_db()
        self.assertEqual(demo.password, password_hash)
        self.assertEqual(WorkoutSession.objects.filter(user=demo).count(), 21)
        self.assertEqual(ExerciseSet.objects.filter(workout_session__user=demo).count(), 189)
        self.assertEqual(BodyWeightEntry.objects.filter(user=demo).count(), 28)
        self.assertEqual(JournalEntry.objects.filter(user=demo).count(), 3)
        self.assertTrue(WorkoutSession.objects.filter(pk=private_workout.pk, user=other).exists())

    def test_existing_non_demo_username_is_not_modified(self):
        existing = User.objects.create_user(username=DEMO_USERNAME, email="someone@example.test", password="PrivateAccount2026!")
        with self.assertRaisesMessage(CommandError, "already in use"):
            self.seed()
        existing.refresh_from_db()
        self.assertEqual(existing.email, "someone@example.test")
        self.assertTrue(existing.check_password("PrivateAccount2026!"))
        self.assertFalse(WorkoutSession.objects.exists())

    def test_catalog_failure_rolls_back_demo_creation(self):
        with patch("workouts.management.commands.seed_demo.call_command", side_effect=CommandError("Catalog failed")):
            with self.assertRaisesMessage(CommandError, "Catalog failed"):
                self.seed()
        self.assertFalse(User.objects.filter(email=DEMO_EMAIL).exists())
