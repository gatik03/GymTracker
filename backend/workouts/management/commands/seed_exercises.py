from django.core.management.base import BaseCommand

from workouts.models import Exercise
from workouts.services.exercises import load_builtin_exercise_records


class Command(BaseCommand):
    help = 'Seed the built-in exercise catalog.'

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for record in load_builtin_exercise_records():
            _, created = Exercise.objects.get_or_create(
                name=record['name'],
                is_custom=False,
                defaults={
                    **record,
                    'is_custom': False,
                    'created_by': None,
                },
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seed complete. Created {created_count} exercises, skipped {skipped_count} existing records.'
        ))
