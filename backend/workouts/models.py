from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Exercise(models.Model):
    class MuscleGroup(models.TextChoices):
        CHEST = 'chest', 'Chest'
        BACK = 'back', 'Back'
        SHOULDERS = 'shoulders', 'Shoulders'
        BICEPS = 'biceps', 'Biceps'
        TRICEPS = 'triceps', 'Triceps'
        FOREARMS = 'forearms', 'Forearms'
        ABS = 'abs', 'Abs'
        QUADS = 'quads', 'Quads'
        HAMSTRINGS = 'hamstrings', 'Hamstrings'
        GLUTES = 'glutes', 'Glutes'
        CALVES = 'calves', 'Calves'
        FULL_BODY = 'full_body', 'Full Body'

    class Equipment(models.TextChoices):
        BARBELL = 'barbell', 'Barbell'
        DUMBBELL = 'dumbbell', 'Dumbbell'
        MACHINE = 'machine', 'Machine'
        CABLE = 'cable', 'Cable'
        BODYWEIGHT = 'bodyweight', 'Bodyweight'
        KETTLEBELL = 'kettlebell', 'Kettlebell'
        RESISTANCE_BAND = 'resistance_band', 'Resistance Band'
        SMITH_MACHINE = 'smith_machine', 'Smith Machine'
        OTHER = 'other', 'Other'

    class Difficulty(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class ExerciseType(models.TextChoices):
        COMPOUND = 'compound', 'Compound'
        ISOLATION = 'isolation', 'Isolation'

    name = models.CharField(max_length=140)
    muscle_group = models.CharField(max_length=20, choices=MuscleGroup.choices)
    equipment = models.CharField(
        max_length=20,
        choices=Equipment.choices,
        default=Equipment.OTHER,
    )
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.BEGINNER,
    )
    exercise_type = models.CharField(
        max_length=20,
        choices=ExerciseType.choices,
        default=ExerciseType.COMPOUND,
    )
    is_custom = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='custom_exercises',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.CheckConstraint(
                condition=(
                    (models.Q(is_custom=True) & models.Q(created_by__isnull=False)) |
                    (models.Q(is_custom=False) & models.Q(created_by__isnull=True))
                ),
                name='exercise_custom_state_matches_owner',
            ),
            models.UniqueConstraint(
                fields=['name', 'created_by'],
                condition=models.Q(is_custom=True),
                name='unique_custom_exercise_per_user',
            ),
            models.UniqueConstraint(
                fields=['name'],
                condition=models.Q(is_custom=False),
                name='unique_builtin_exercise_name',
            ),
        ]

    def __str__(self):
        return self.name


class WorkoutSession(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        COMPLETED = "completed", "Completed"

    WORKOUT_TYPES = [
        ('push', 'Push'),
        ('pull', 'Pull'),
        ('legs', 'Legs'),
        ('upper', 'Upper'),
        ('lower', 'Lower'),
        ('full_body', 'Full Body'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    workout_type = models.CharField(
        max_length=20,
        choices=WORKOUT_TYPES,
        default='custom',
    )
    date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="draft"),
                name="unique_active_workout_draft_per_user",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(status="draft", completed_at__isnull=True)
                    | models.Q(status="completed", completed_at__isnull=False)
                ),
                name="workout_status_matches_completion_time",
            ),
        ]
        indexes = [models.Index(fields=["user", "status", "-date"])]

    def __str__(self):
        return f"{self.title} - {self.date}"


class ExerciseSet(models.Model):
    workout_session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name='sets',
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.PositiveIntegerField()
    weight = models.FloatField()
    reps = models.PositiveIntegerField()
    rpe = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    rir = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(set_number__gte=1), name="exercise_set_number_gte_1"),
            models.CheckConstraint(condition=models.Q(set_number__lte=1000), name="exercise_set_number_lte_1000"),
            models.CheckConstraint(condition=models.Q(weight__gte=0), name="exercise_set_weight_gte_0"),
            models.CheckConstraint(condition=models.Q(weight__lte=2000), name="exercise_set_weight_lte_2000"),
            models.CheckConstraint(condition=models.Q(reps__gte=1), name="exercise_set_reps_gte_1"),
            models.CheckConstraint(condition=models.Q(reps__lte=1000), name="exercise_set_reps_lte_1000"),
            models.CheckConstraint(condition=models.Q(rpe__isnull=True) | models.Q(rpe__gte=1), name="exercise_set_rpe_gte_1"),
            models.CheckConstraint(condition=models.Q(rpe__isnull=True) | models.Q(rpe__lte=10), name="exercise_set_rpe_lte_10"),
            models.CheckConstraint(condition=models.Q(rir__isnull=True) | models.Q(rir__lte=10), name="exercise_set_rir_lte_10"),
            models.UniqueConstraint(
                fields=["workout_session", "exercise", "set_number"],
                name="unique_set_number_per_workout_exercise",
            ),
        ]

    def __str__(self):
        return f"{self.exercise.name} - {self.weight}kg x {self.reps}"


class BodyWeightEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    weight = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ('user', 'date')
        constraints = [
            models.CheckConstraint(condition=models.Q(weight__gte=20), name="bodyweight_gte_20"),
            models.CheckConstraint(condition=models.Q(weight__lte=500), name="bodyweight_lte_500"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.weight}kg on {self.date}"


class FavoriteExercise(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorite_exercises',
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='favorited_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'exercise'],
                name='unique_favorite_exercise_per_user',
            )
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.exercise.name}"


class AccountProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="account_profile",
    )
    normalized_email = models.EmailField(max_length=254, unique=True, null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Account profile for user {self.user_id}"


class AccountActionCode(models.Model):
    class Purpose(models.TextChoices):
        VERIFY_EMAIL = "verify_email", "Verify email"
        RESET_PASSWORD = "reset_password", "Reset password"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="account_action_codes",
    )
    purpose = models.CharField(max_length=24, choices=Purpose.choices)
    code_digest = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "purpose", "consumed_at"])]

    def __str__(self):
        return f"{self.purpose} code for user {self.user_id}"


class OAuthIdentity(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        GITHUB = "github", "GitHub"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="oauth_identities",
    )
    provider = models.CharField(max_length=16, choices=Provider.choices)
    subject = models.CharField(max_length=255)
    email = models.EmailField(max_length=254, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "subject"],
                name="unique_oauth_provider_subject",
            ),
            models.UniqueConstraint(
                fields=["user", "provider"],
                name="unique_oauth_provider_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.provider} identity for user {self.user_id}"


class JournalEntry(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="journal_entries",
    )
    date = models.DateField(default=timezone.localdate)
    title = models.CharField(max_length=160, blank=True)
    content = models.TextField(max_length=20000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-updated_at"]
        indexes = [models.Index(fields=["user", "-date"])]

    def __str__(self):
        return f"Journal entry {self.pk} for user {self.user_id}"
