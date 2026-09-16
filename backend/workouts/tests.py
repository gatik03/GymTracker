from django.test import TestCase, override_settings
from django.core import mail
from django.utils import timezone
from datetime import timedelta
import re
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse
from django.contrib.admin.sites import site
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
import datetime
from .models import Exercise, WorkoutSession, ExerciseSet, BodyWeightEntry, JournalEntry, OAuthIdentity
from .admin import ExerciseAdmin, WorkoutSessionAdmin, ExerciseSetAdmin


class WorkoutsAdminTest(TestCase):

    def test_exercise_admin_registered(self):
        self.assertIn(Exercise, site._registry)
        self.assertIsInstance(site._registry[Exercise], ExerciseAdmin)

    def test_workout_session_admin_registered(self):
        self.assertIn(WorkoutSession, site._registry)
        self.assertIsInstance(site._registry[WorkoutSession], WorkoutSessionAdmin)

    def test_exercise_set_admin_registered(self):
        self.assertIn(ExerciseSet, site._registry)
        self.assertIsInstance(site._registry[ExerciseSet], ExerciseSetAdmin)


class WorkoutsAnalyticsTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            password="testpassword"
        )

        # Create exercises for user
        self.bench_press = Exercise.objects.create(
            name="Bench Press",
            muscle_group="chest",
            created_by=self.user
        )
        self.squat = Exercise.objects.create(
            name="Squat",
            muscle_group="quads",
            created_by=self.user
        )

        # Create exercises for other user (to test isolation)
        self.other_exercise = Exercise.objects.create(
            name="Deadlift",
            muscle_group="back",
            created_by=self.other_user
        )

        # Workout Session 1: 2026-06-01 (chest day)
        self.session1 = WorkoutSession.objects.create(
            user=self.user,
            title="Chest Day",
            workout_type="push",
            date=datetime.date(2026, 6, 1),
            status=WorkoutSession.Status.COMPLETED,
            completed_at=timezone.now()
        )
        self.set1 = ExerciseSet.objects.create(
            workout_session=self.session1,
            exercise=self.bench_press,
            set_number=1,
            weight=100.0,
            reps=5
        )
        self.set2 = ExerciseSet.objects.create(
            workout_session=self.session1,
            exercise=self.bench_press,
            set_number=2,
            weight=105.0,
            reps=4
        )

        # Workout Session 2: 2026-06-08 (legs day)
        self.session2 = WorkoutSession.objects.create(
            user=self.user,
            title="Leg Day",
            workout_type="legs",
            date=datetime.date(2026, 6, 8),
            status=WorkoutSession.Status.COMPLETED,
            completed_at=timezone.now()
        )
        self.set3 = ExerciseSet.objects.create(
            workout_session=self.session2,
            exercise=self.squat,
            set_number=1,
            weight=120.0,
            reps=6
        )

        # Workout Session 3: 2026-06-15 (chest day 2)
        self.session3 = WorkoutSession.objects.create(
            user=self.user,
            title="Chest Day 2",
            workout_type="push",
            date=datetime.date(2026, 6, 15),
            status=WorkoutSession.Status.COMPLETED,
            completed_at=timezone.now()
        )
        self.set4 = ExerciseSet.objects.create(
            workout_session=self.session3,
            exercise=self.bench_press,
            set_number=1,
            weight=110.0,
            reps=3
        )
        self.set5 = ExerciseSet.objects.create(
            workout_session=self.session3,
            exercise=self.bench_press,
            set_number=2,
            weight=120.0,
            reps=1
        )

        # Other user workout session (to verify user isolation)
        self.other_session = WorkoutSession.objects.create(
            user=self.other_user,
            title="Back Day",
            workout_type="pull",
            date=datetime.date(2026, 6, 1),
            status=WorkoutSession.Status.COMPLETED,
            completed_at=timezone.now()
        )
        self.other_set = ExerciseSet.objects.create(
            workout_session=self.other_session,
            exercise=self.other_exercise,
            set_number=1,
            weight=150.0,
            reps=5
        )

    def test_analytics_endpoints_require_authentication(self):
        endpoints = [
            "/api/analytics/total-volume/",
            f"/api/analytics/exercise-progress/{self.bench_press.id}/",
            "/api/analytics/prs/",
            "/api/analytics/volume-per-exercise/",
            "/api/analytics/volume-per-muscle-group/",
            "/api/analytics/weekly-volume/",
            "/api/analytics/daily-volume/",
            "/api/analytics/monthly-volume/",
            f"/api/analytics/estimated-1rm/{self.bench_press.id}/",
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Failed for {url}")

    def test_total_volume_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/total-volume/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expected: bench sets = 100*5 + 105*4 + 110*3 + 120*1 = 1370
        # squat set = 120*6 = 720
        # Total = 2090.0
        self.assertEqual(response.data["total_volume"], 2090.0)

    def test_exercise_progress_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/analytics/exercise-progress/{self.bench_press.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 2 dates for bench press
        self.assertEqual(len(response.data), 2)
        # Session 1: max_weight=105.0, total_volume=920.0, estimated_1rm=max(116.67, 119.0) = 119.0
        self.assertEqual(response.data[0]["date"], "2026-06-01")
        self.assertEqual(response.data[0]["max_weight"], 105.0)
        self.assertEqual(response.data[0]["total_volume"], 920.0)
        self.assertEqual(response.data[0]["estimated_1rm"], 119.0)
        # Session 3: max_weight=120.0, total_volume=450.0, estimated_1rm=max(121.0, 120.0) = 121.0
        self.assertEqual(response.data[1]["date"], "2026-06-15")
        self.assertEqual(response.data[1]["max_weight"], 120.0)
        self.assertEqual(response.data[1]["total_volume"], 450.0)
        self.assertEqual(response.data[1]["estimated_1rm"], 121.0)

    def test_personal_records_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/prs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Bench Press and Squat

        bench_pr = next(item for item in response.data if item["exercise_id"] == self.bench_press.id)
        self.assertEqual(bench_pr["max_weight"], 120.0)
        self.assertEqual(bench_pr["max_weight_date"], "2026-06-15")
        self.assertEqual(bench_pr["max_estimated_1rm"], 121.0)

        squat_pr = next(item for item in response.data if item["exercise_id"] == self.squat.id)
        self.assertEqual(squat_pr["max_weight"], 120.0)
        self.assertEqual(squat_pr["max_weight_date"], "2026-06-08")
        self.assertEqual(squat_pr["max_estimated_1rm"], 144.0)

    def test_volume_per_exercise_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/volume-per-exercise/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check volume is ordered descending by default
        self.assertEqual(response.data[0]["exercise_name"], "Bench Press")
        self.assertEqual(response.data[0]["total_volume"], 1370.0)
        self.assertEqual(response.data[1]["exercise_name"], "Squat")
        self.assertEqual(response.data[1]["total_volume"], 720.0)

    def test_volume_per_muscle_group_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/volume-per-muscle-group/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # chest should have 1370.0, legs 720.0
        chest_vol = next(item for item in response.data if item["muscle_group"] == "chest")
        self.assertEqual(chest_vol["total_volume"], 1370.0)
        quads_vol = next(item for item in response.data if item["muscle_group"] == "quads")
        self.assertEqual(quads_vol["total_volume"], 720.0)

    def test_weekly_volume_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/weekly-volume/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        # Ensure volumes are rounded and not null
        for week in response.data:
            self.assertIn("week", week)
            self.assertGreater(week["total_volume"], 0)

    def test_daily_volume_uses_only_actual_training_dates(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/daily-volume/", {"month": "2026-06"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [
            {"date": "2026-06-01", "total_volume": 920.0},
            {"date": "2026-06-08", "total_volume": 720.0},
            {"date": "2026-06-15", "total_volume": 450.0},
        ])
        invalid = self.client.get("/api/analytics/daily-volume/", {"month": "June"})
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_monthly_volume_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/analytics/monthly-volume/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # All sessions in June 2026
        self.assertEqual(response.data[0]["total_volume"], 2090.0)

    def test_estimated_1rm_view(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/analytics/estimated-1rm/{self.bench_press.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Progression dates: 2026-06-01, 2026-06-15
        self.assertEqual(response.data[0]["date"], "2026-06-01")
        self.assertEqual(response.data[0]["estimated_1rm"], 119.0)
        self.assertEqual(response.data[1]["date"], "2026-06-15")
        self.assertEqual(response.data[1]["estimated_1rm"], 121.0)


class WorkoutsBodyWeightTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="weightuser",
            password="testpassword"
        )
        self.other_user = User.objects.create_user(
            username="otherweightuser",
            password="testpassword"
        )
        self.client.force_authenticate(user=self.user)

    def test_bodyweight_crud(self):
        response = self.client.post("/api/bodyweight/", {
            "weight": 82.5,
            "date": "2026-06-01"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["weight"], 82.5)

        response = self.client.get("/api/bodyweight/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.post("/api/bodyweight/", {
            "weight": 83.0,
            "date": "2026-06-01"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bodyweight_analytics(self):
        today = datetime.date.today()
        BodyWeightEntry.objects.create(
            user=self.user,
            weight=85.0,
            date=today - datetime.timedelta(days=14)
        )
        BodyWeightEntry.objects.create(
            user=self.user,
            weight=84.0,
            date=today - datetime.timedelta(days=7)
        )
        BodyWeightEntry.objects.create(
            user=self.user,
            weight=83.0,
            date=today
        )

        response = self.client.get("/api/analytics/bodyweight/trend/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertEqual(response.data[0]["weight"], 85.0)
        self.assertEqual(response.data[2]["weight"], 83.0)

        response = self.client.get("/api/analytics/bodyweight/rate/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_weight"], 83.0)
        self.assertEqual(response.data["starting_weight"], 85.0)
        self.assertEqual(response.data["total_change"], -2.0)
        self.assertEqual(response.data["rate_per_week"], -1.0)
        self.assertIn("losing weight", response.data["message"])





class ExerciseCatalogApiTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="cataloguser",
            password="testpassword",
        )
        self.other_user = User.objects.create_user(
            username="othercataloguser",
            password="testpassword",
        )
        self.client.force_authenticate(user=self.user)
        self.builtin = Exercise.objects.create(
            name="Barbell Bench Press",
            muscle_group="chest",
            equipment="barbell",
            difficulty="beginner",
            exercise_type="compound",
            is_custom=False,
            created_by=None,
        )
        self.custom = Exercise.objects.create(
            name="My Cable Press",
            muscle_group="chest",
            equipment="cable",
            difficulty="intermediate",
            exercise_type="compound",
            is_custom=True,
            created_by=self.user,
        )
        self.other_custom = Exercise.objects.create(
            name="Private Other Exercise",
            muscle_group="back",
            is_custom=True,
            created_by=self.other_user,
        )

    def test_catalog_is_paginated_and_user_scoped(self):
        response = self.client.get("/api/exercises/", {"page_size": 50})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        visible_ids = {item["id"] for item in response.data["results"]}
        self.assertIn(self.builtin.id, visible_ids)
        self.assertIn(self.custom.id, visible_ids)
        self.assertNotIn(self.other_custom.id, visible_ids)

    def test_catalog_search_and_custom_creation_contract(self):
        response = self.client.get("/api/exercises/", {"search": "bench"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["id"], self.builtin.id)

        response = self.client.post("/api/exercises/", {
            "name": "Wrong endpoint",
            "muscle_group": "chest",
        })
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        response = self.client.post("/api/exercises/custom/", {
            "name": "My Split Squat",
            "muscle_group": "quads",
            "equipment": "dumbbell",
            "difficulty": "intermediate",
            "exercise_type": "compound",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_custom"])
        self.assertEqual(response.data["created_by"], self.user.id)

    def test_favorites_are_idempotent_and_private(self):
        first = self.client.post(f"/api/exercises/{self.builtin.id}/favorite/")
        second = self.client.post(f"/api/exercises/{self.builtin.id}/favorite/")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)

        response = self.client.get("/api/exercises/favorites/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.builtin.id])

        response = self.client.delete(f"/api/exercises/{self.builtin.id}/favorite/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_other_users_custom_exercise_cannot_be_read_or_used(self):
        response = self.client.get(f"/api/exercises/custom/{self.other_custom.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        session = WorkoutSession.objects.create(
            user=self.user,
            title="Isolation test",
            workout_type="custom",
            date=datetime.date.today(),
        )
        response = self.client.post("/api/exercise-sets/", {
            "workout_session": session.id,
            "exercise": self.other_custom.id,
            "set_number": 1,
            "weight": 20,
            "reps": 10,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CookieAuthenticationSecurityTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="secureuser",
            email="secure@example.com",
            password="StrongPassword-123",
        )
        self.client = self.client_class(enforce_csrf_checks=True)

    def csrf_token(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["csrf_token"]

    def test_login_requires_csrf_and_never_returns_tokens(self):
        response = self.client.post("/api/auth/login/", {
            "username": self.user.username,
            "password": "StrongPassword-123",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        csrf_token = self.csrf_token()
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": "StrongPassword-123"},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], self.user.id)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertTrue(response.cookies["gymtracker_access"]["httponly"])
        self.assertTrue(response.cookies["gymtracker_refresh"]["httponly"])
        self.assertTrue(response.cookies["gymtracker_session"]["httponly"])
        self.assertEqual(response.cookies["gymtracker_session"]["path"], "/")

    def test_session_refresh_and_logout_cookie_flow(self):
        csrf_token = self.csrf_token()
        login = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": "StrongPassword-123"},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        session = self.client.get("/api/auth/session/")
        self.assertEqual(session.status_code, status.HTTP_200_OK)
        self.assertEqual(session.data["user"]["username"], self.user.username)

        refreshed = self.client.post("/api/auth/refresh/", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn("gymtracker_access", refreshed.cookies)
        self.assertIn("gymtracker_refresh", refreshed.cookies)

        logged_out = self.client.post("/api/auth/logout/", HTTP_X_CSRFTOKEN=csrf_token)
        self.assertEqual(logged_out.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(logged_out.cookies["gymtracker_access"]["max-age"], 0)
        self.assertEqual(logged_out.cookies["gymtracker_refresh"]["max-age"], 0)
        self.assertEqual(logged_out.cookies["gymtracker_session"]["max-age"], 0)


class JournalPrivacyApiTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="journaluser", password="testpassword")
        self.other_user = User.objects.create_user(username="otherjournaluser", password="testpassword")
        self.client.force_authenticate(user=self.user)

    def test_journal_crud_is_private_and_owner_is_not_serialized(self):
        created = self.client.post("/api/journal/", {
            "date": "2026-08-30",
            "title": "Good training day",
            "content": "A private reflection about today.",
        })
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("user", created.data)
        entry_id = created.data["id"]

        other_entry = JournalEntry.objects.create(
            user=self.other_user,
            date=datetime.date(2026, 8, 29),
            title="Other user private entry",
            content="This must never be visible.",
        )
        listed = self.client.get("/api/journal/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in listed.data], [entry_id])

        self.assertEqual(self.client.get(f"/api/journal/{other_entry.id}/").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.patch(f"/api/journal/{other_entry.id}/", {"title": "stolen"}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(f"/api/journal/{other_entry.id}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_journal_content_is_rejected(self):
        response = self.client.post("/api/journal/", {
            "date": "2026-08-30",
            "content": "   ",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AccountLifecycleSecurityTest(APITestCase):

    def setUp(self):
        self.client = self.client_class(enforce_csrf_checks=True)

    def csrf_token(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["csrf_token"]

    def code_from_latest_email(self):
        match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_registration_verification_and_email_login(self):
        payload = {
            "username": "newathlete",
            "email": "Athlete@Example.com",
            "password": "Strong-Registration-Password-42",
            "password_confirm": "Strong-Registration-Password-42",
        }
        self.assertEqual(
            self.client.post("/api/auth/register/", payload).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        csrf_token = self.csrf_token()
        registered = self.client.post(
            "/api/auth/register/",
            payload,
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(registered.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newathlete")
        self.assertFalse(user.is_active)
        self.assertEqual(user.email, "athlete@example.com")
        action_code = user.account_action_codes.get()
        code = self.code_from_latest_email()
        self.assertNotEqual(action_code.code_digest, code)

        before_verification = self.client.post(
            "/api/auth/login/",
            {"username": user.email, "password": payload["password"]},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(before_verification.status_code, status.HTTP_401_UNAUTHORIZED)

        verified = self.client.post(
            "/api/auth/verify-email/confirm/",
            {"identifier": user.email, "code": code},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertTrue(verified.data["user"]["email_verified"])
        self.assertTrue(verified.cookies["gymtracker_access"]["httponly"])
        user.refresh_from_db()
        self.assertTrue(user.is_active)

        reused = self.client.post(
            "/api/auth/verify-email/confirm/",
            {"identifier": user.email, "code": code},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)

        logged_in = self.client.post(
            "/api/auth/login/",
            {"username": "ATHLETE@example.com", "password": payload["password"]},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(logged_in.status_code, status.HTTP_200_OK)

    def test_expired_verification_code_is_rejected(self):
        csrf_token = self.csrf_token()
        registered = self.client.post(
            "/api/auth/register/",
            {
                "username": "expiredathlete",
                "email": "expired@example.com",
                "password": "Strong-Registration-Password-42",
                "password_confirm": "Strong-Registration-Password-42",
            },
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(registered.status_code, status.HTTP_201_CREATED)
        code = self.code_from_latest_email()
        action_code = User.objects.get(username="expiredathlete").account_action_codes.get()
        action_code.expires_at = timezone.now() - timedelta(seconds=1)
        action_code.save(update_fields=["expires_at"])
        response = self.client.post(
            "/api/auth/verify-email/confirm/",
            {"identifier": "expired@example.com", "code": code},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_is_generic_single_use_and_replaces_password(self):
        user = User.objects.create_user(
            username="resetathlete",
            email="reset@example.com",
            password="Old-Strong-Password-42",
        )
        csrf_token = self.csrf_token()
        unknown = self.client.post(
            "/api/auth/password-reset/request/",
            {"identifier": "unknown@example.com"},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

        requested = self.client.post(
            "/api/auth/password-reset/request/",
            {"identifier": user.email},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(requested.status_code, status.HTTP_200_OK)
        code = self.code_from_latest_email()
        reset_payload = {
            "identifier": user.email,
            "code": code,
            "password": "New-Strong-Password-84",
            "password_confirm": "New-Strong-Password-84",
        }
        reset = self.client.post(
            "/api/auth/password-reset/confirm/",
            reset_payload,
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(reset.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("New-Strong-Password-84"))
        self.assertFalse(user.check_password("Old-Strong-Password-42"))
        self.assertEqual(
            self.client.post(
                "/api/auth/password-reset/confirm/",
                reset_payload,
                HTTP_X_CSRFTOKEN=csrf_token,
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )


@override_settings(
    GOOGLE_CLIENT_ID="google-client",
    GOOGLE_CLIENT_SECRET="google-secret",
    GOOGLE_REDIRECT_URI="http://testserver/api/auth/oauth/google/callback/",
    GITHUB_CLIENT_ID="github-client",
    GITHUB_CLIENT_SECRET="github-secret",
    GITHUB_REDIRECT_URI="http://testserver/api/auth/oauth/github/callback/",
    FRONTEND_URL="http://frontend.test",
)
class OAuthSecurityTest(APITestCase):

    def setUp(self):
        self.client = self.client_class(enforce_csrf_checks=True)
        csrf = self.client.get("/api/auth/csrf/")
        self.csrf_token = csrf.data["csrf_token"]

    def start(self, provider="google", destination="/"):
        response = self.client.post(
            f"/api/auth/oauth/{provider}/start/",
            {"next": destination},
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        state = parse_qs(urlparse(response.data["authorization_url"]).query)["state"][0]
        return response, state

    @patch("workouts.oauth_views.fetch_oauth_profile")
    def test_oauth_creates_account_without_exposing_provider_tokens(self, profile_mock):
        from .oauth_services import OAuthProviderProfile

        profile_mock.return_value = OAuthProviderProfile(
            subject="google-subject-1",
            email="oauth@example.com",
            username_hint="oauth-athlete",
        )
        started, state = self.start(destination="/journal")
        self.assertTrue(started.cookies["gymtracker_oauth_google_state"]["httponly"])
        callback = self.client.get(
            "/api/auth/oauth/google/callback/",
            {"state": state, "code": "provider-code"},
        )
        self.assertEqual(callback.status_code, status.HTTP_302_FOUND)
        self.assertEqual(callback["Location"], "http://frontend.test/journal")
        self.assertNotIn("provider-code", callback["Location"])
        self.assertIn("gymtracker_access", callback.cookies)
        user = User.objects.get(email="oauth@example.com")
        self.assertFalse(user.has_usable_password())
        self.assertTrue(user.account_profile.email_verified_at)
        self.assertTrue(OAuthIdentity.objects.filter(user=user, provider="google", subject="google-subject-1").exists())

    @patch("workouts.oauth_views.fetch_oauth_profile")
    def test_invalid_state_is_rejected_before_provider_exchange(self, profile_mock):
        self.start()
        callback = self.client.get(
            "/api/auth/oauth/google/callback/",
            {"state": "tampered", "code": "provider-code"},
        )
        self.assertEqual(callback.status_code, status.HTTP_302_FOUND)
        self.assertIn("oauth_error=invalid_state", callback["Location"])
        profile_mock.assert_not_called()
        self.assertNotIn("gymtracker_access", callback.cookies)

    @patch("workouts.oauth_views.fetch_oauth_profile")
    def test_existing_email_is_not_silently_linked(self, profile_mock):
        from .oauth_services import OAuthProviderProfile

        existing = User.objects.create_user(
            username="password-user",
            email="shared@example.com",
            password="Strong-Password-42",
        )
        profile_mock.return_value = OAuthProviderProfile(
            subject="google-subject-2",
            email="shared@example.com",
            username_hint="shared",
        )
        _, state = self.start()
        callback = self.client.get(
            "/api/auth/oauth/google/callback/",
            {"state": state, "code": "provider-code"},
        )
        self.assertIn("oauth_error=account_exists", callback["Location"])
        self.assertFalse(OAuthIdentity.objects.filter(user=existing).exists())
        self.assertEqual(User.objects.filter(email="shared@example.com").count(), 1)

    @patch("workouts.oauth_views.fetch_oauth_profile")
    def test_authenticated_user_can_explicitly_link_provider(self, profile_mock):
        from .oauth_services import OAuthProviderProfile

        user = User.objects.create_user(
            username="link-user",
            email="link@example.com",
            password="Strong-Password-42",
        )
        profile_mock.return_value = OAuthProviderProfile(
            subject="github-subject-1",
            email="provider@example.com",
            username_hint="link-user",
        )
        self.client.force_authenticate(user=user)
        started, state = self.start(provider="github", destination="/profile")
        state_cookie = started.cookies["gymtracker_oauth_github_state"].value
        self.client.force_authenticate(user=None)
        self.client.cookies["gymtracker_oauth_github_state"] = state_cookie
        callback = self.client.get(
            "/api/auth/oauth/github/callback/",
            {"state": state, "code": "provider-code"},
        )
        self.assertEqual(callback["Location"], "http://frontend.test/profile")
        self.assertTrue(OAuthIdentity.objects.filter(user=user, provider="github").exists())

    def test_destination_is_allowlisted_and_start_requires_csrf(self):
        no_csrf_client = self.client_class(enforce_csrf_checks=True)
        denied = no_csrf_client.post("/api/auth/oauth/google/start/", {"next": "https://evil.example"})
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        _, state = self.start(destination="https://evil.example")
        from django.core import signing
        from .oauth_views import STATE_SALT

        payload = signing.loads(state, salt=STATE_SALT)
        self.assertEqual(payload["next"], "/")


class OwnershipAndInputSecurityTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="Strong-Password-42")
        self.other_user = User.objects.create_user(username="other-owner", password="Strong-Password-42")
        self.exercise = Exercise.objects.create(
            name="Security Test Bench",
            muscle_group="chest",
            is_custom=False,
            created_by=None,
        )
        self.other_session = WorkoutSession.objects.create(
            user=self.other_user,
            title="Private workout",
            workout_type="push",
            date=datetime.date(2026, 8, 30),
        )
        self.other_set = ExerciseSet.objects.create(
            workout_session=self.other_session,
            exercise=self.exercise,
            set_number=1,
            weight=80,
            reps=8,
        )
        self.other_weight = BodyWeightEntry.objects.create(
            user=self.other_user,
            weight=80,
            date=datetime.date(2026, 8, 30),
        )
        self.client.force_authenticate(user=self.user)

    def assert_hidden_for_all_mutations(self, endpoint):
        self.assertEqual(self.client.get(endpoint).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.patch(endpoint, {"title": "stolen"}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(endpoint).status_code, status.HTTP_404_NOT_FOUND)

    def test_other_users_workout_set_and_bodyweight_are_hidden(self):
        self.assert_hidden_for_all_mutations(f"/api/workout-sessions/{self.other_session.pk}/")
        self.assert_hidden_for_all_mutations(f"/api/exercise-sets/{self.other_set.pk}/")
        self.assert_hidden_for_all_mutations(f"/api/bodyweight/{self.other_weight.pk}/")

        workouts = self.client.get("/api/workout-sessions/")
        sets = self.client.get("/api/exercise-sets/")
        bodyweight = self.client.get("/api/bodyweight/")
        self.assertEqual(workouts.data, [])
        self.assertEqual(sets.data, [])
        self.assertEqual(bodyweight.data, [])

    def test_user_cannot_create_set_in_another_users_workout(self):
        response = self.client.post("/api/exercise-sets/", {
            "workout_session": self.other_session.pk,
            "exercise": self.exercise.pk,
            "set_number": 1,
            "weight": 80,
            "reps": 8,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_numeric_bounds_and_query_parameters_are_validated(self):
        own_session = WorkoutSession.objects.create(
            user=self.user,
            title="My workout",
            workout_type="push",
            date=datetime.date(2026, 8, 30),
        )
        set_response = self.client.post("/api/exercise-sets/", {
            "workout_session": own_session.pk,
            "exercise": self.exercise.pk,
            "set_number": 0,
            "weight": -1,
            "reps": 0,
        })
        self.assertEqual(set_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("set_number", set_response.data)
        self.assertIn("weight", set_response.data)
        self.assertIn("reps", set_response.data)

        bodyweight = self.client.post("/api/bodyweight/", {
            "weight": 10,
            "date": "2026-08-30",
        })
        self.assertEqual(bodyweight.status_code, status.HTTP_400_BAD_REQUEST)

        recent = self.client.get("/api/exercises/recent/", {"limit": "not-a-number"})
        self.assertEqual(recent.status_code, status.HTTP_400_BAD_REQUEST)

    def test_primary_private_endpoints_reject_unauthenticated_requests(self):
        self.client.force_authenticate(user=None)
        for endpoint in [
            "/api/workout-sessions/",
            "/api/exercise-sets/",
            "/api/bodyweight/",
            "/api/journal/",
            "/api/exercises/",
            "/api/auth/session/",
        ]:
            self.assertEqual(
                self.client.get(endpoint).status_code,
                status.HTTP_401_UNAUTHORIZED,
                endpoint,
            )


class WorkoutDraftLifecycleTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="workout-lifecycle",
            password="Strong-Password-42",
        )
        self.other_user = User.objects.create_user(
            username="workout-lifecycle-other",
            password="Strong-Password-42",
        )
        self.exercise = Exercise.objects.create(
            name="Lifecycle Bench Press",
            muscle_group="chest",
            equipment="barbell",
            difficulty="beginner",
            exercise_type="compound",
            is_custom=False,
            created_by=None,
        )
        self.client.force_authenticate(user=self.user)

    def start_workout(self):
        return self.client.post(
            "/api/workout-sessions/",
            {
                "title": "Push day",
                "workout_type": "push",
                "date": "2026-08-30",
                "notes": "",
            },
        )

    def test_draft_can_be_recovered_and_only_one_can_exist(self):
        created = self.start_workout()
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["status"], WorkoutSession.Status.DRAFT)
        self.assertEqual(created.data["total_sets"], 0)

        duplicate = self.start_workout()
        self.assertEqual(duplicate.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(duplicate.data["active_workout_id"], created.data["id"])

        active = self.client.get("/api/workout-sessions/active-draft/")
        self.assertEqual(active.status_code, status.HTTP_200_OK)
        self.assertEqual(active.data["id"], created.data["id"])
        self.assertEqual(self.client.get("/api/workout-sessions/").data, [])

    def test_completion_requires_a_set_and_returns_a_summary(self):
        workout = self.start_workout().data
        empty_completion = self.client.post(
            f"/api/workout-sessions/{workout['id']}/complete/"
        )
        self.assertEqual(empty_completion.status_code, status.HTTP_400_BAD_REQUEST)

        workout_set = self.client.post(
            "/api/exercise-sets/",
            {
                "workout_session": workout["id"],
                "exercise": self.exercise.id,
                "set_number": 1,
                "weight": 100,
                "reps": 8,
                "rpe": 8.5,
                "rir": 2,
                "notes": "Controlled tempo",
            },
        )
        self.assertEqual(workout_set.status_code, status.HTTP_201_CREATED)

        completed = self.client.post(
            f"/api/workout-sessions/{workout['id']}/complete/"
        )
        self.assertEqual(completed.status_code, status.HTTP_200_OK)
        self.assertEqual(completed.data["status"], WorkoutSession.Status.COMPLETED)
        self.assertEqual(completed.data["exercise_count"], 1)
        self.assertEqual(completed.data["total_sets"], 1)
        self.assertEqual(completed.data["total_volume"], 800.0)
        self.assertIsNotNone(completed.data["completed_at"])

        repeated = self.client.post(
            f"/api/workout-sessions/{workout['id']}/complete/"
        )
        self.assertEqual(repeated.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            self.client.get("/api/workout-sessions/active-draft/").status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertEqual(len(self.client.get("/api/workout-sessions/").data), 1)

        changed = self.client.patch(
            f"/api/exercise-sets/{workout_set.data['id']}/",
            {"weight": 105},
        )
        removed = self.client.delete(
            f"/api/exercise-sets/{workout_set.data['id']}/"
        )
        self.assertEqual(changed.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(removed.status_code, status.HTTP_409_CONFLICT)

    def test_draft_sets_do_not_affect_analytics_until_completion(self):
        workout = self.start_workout().data
        self.client.post(
            "/api/exercise-sets/",
            {
                "workout_session": workout["id"],
                "exercise": self.exercise.id,
                "set_number": 1,
                "weight": 80,
                "reps": 10,
            },
        )
        before = self.client.get("/api/analytics/total-volume/")
        self.assertEqual(before.data["total_volume"], 0)

        self.client.post(f"/api/workout-sessions/{workout['id']}/complete/")
        after = self.client.get("/api/analytics/total-volume/")
        self.assertEqual(after.data["total_volume"], 800.0)

    def test_another_user_cannot_complete_a_private_draft(self):
        workout = self.start_workout().data
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(
            f"/api/workout-sessions/{workout['id']}/complete/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_advanced_set_fields_are_bounded(self):
        workout = self.start_workout().data
        response = self.client.post(
            "/api/exercise-sets/",
            {
                "workout_session": workout["id"],
                "exercise": self.exercise.id,
                "set_number": 1,
                "weight": 80,
                "reps": 8,
                "rpe": 11,
                "rir": 12,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rpe", response.data)
        self.assertIn("rir", response.data)
