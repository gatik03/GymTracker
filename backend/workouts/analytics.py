from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F, ExpressionWrapper, FloatField
from django.db.models.functions import TruncWeek, TruncMonth
import datetime

from .models import ExerciseSet, Exercise, BodyWeightEntry, WorkoutSession


def completed_sets_for(user):
    return ExerciseSet.objects.filter(
        workout_session__user=user,
        workout_session__status=WorkoutSession.Status.COMPLETED,
    )


class TotalVolumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_volume = 0
        sets = completed_sets_for(request.user)

        for workout_set in sets:
            total_volume += (
                workout_set.weight *
                workout_set.reps
            )

        return Response({
            "total_volume": total_volume
        })


class ExerciseProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exercise_id):
        sets = completed_sets_for(request.user).filter(
            exercise_id=exercise_id
        ).select_related('workout_session').order_by('workout_session__date')

        session_data = {}
        for s in sets:
            date_str = s.workout_session.date.isoformat()
            one_rm = s.weight * (1 + s.reps / 30.0) if s.reps > 1 else s.weight
            volume = s.weight * s.reps

            if date_str not in session_data:
                session_data[date_str] = {
                    "date": date_str,
                    "max_weight": s.weight,
                    "total_volume": volume,
                    "estimated_1rm": one_rm
                }
            else:
                curr = session_data[date_str]
                curr["max_weight"] = max(curr["max_weight"], s.weight)
                curr["total_volume"] += volume
                curr["estimated_1rm"] = max(curr["estimated_1rm"], one_rm)

        progress = sorted(session_data.values(), key=lambda x: x["date"])
        for item in progress:
            item["estimated_1rm"] = round(item["estimated_1rm"], 2)
            item["total_volume"] = round(item["total_volume"], 2)

        return Response(progress)


class PersonalRecordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sets = completed_sets_for(request.user).select_related('exercise', 'workout_session')

        prs = {}
        for s in sets:
            ex_id = s.exercise.id
            one_rm = s.weight * (1 + s.reps / 30.0) if s.reps > 1 else s.weight

            if ex_id not in prs:
                prs[ex_id] = {
                    "exercise_id": ex_id,
                    "exercise_name": s.exercise.name,
                    "muscle_group": s.exercise.muscle_group,
                    "max_weight": s.weight,
                    "max_weight_date": s.workout_session.date.isoformat(),
                    "max_estimated_1rm": one_rm,
                    "max_estimated_1rm_date": s.workout_session.date.isoformat(),
                }
            else:
                curr = prs[ex_id]
                if s.weight > curr["max_weight"]:
                    curr["max_weight"] = s.weight
                    curr["max_weight_date"] = s.workout_session.date.isoformat()
                if one_rm > curr["max_estimated_1rm"]:
                    curr["max_estimated_1rm"] = one_rm
                    curr["max_estimated_1rm_date"] = s.workout_session.date.isoformat()

        for pr in prs.values():
            pr["max_estimated_1rm"] = round(pr["max_estimated_1rm"], 2)

        return Response(list(prs.values()))


class VolumePerExerciseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sets = completed_sets_for(request.user)
        volume_by_exercise = sets.values('exercise__id', 'exercise__name').annotate(
            total_volume=Sum(ExpressionWrapper(F('weight') * F('reps'), output_field=FloatField()))
        ).order_by('-total_volume')

        result = [
            {
                "exercise_id": item['exercise__id'],
                "exercise_name": item['exercise__name'],
                "total_volume": round(item['total_volume'], 2)
            }
            for item in volume_by_exercise if item['total_volume'] is not None
        ]
        return Response(result)


class VolumePerMuscleGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sets = completed_sets_for(request.user)
        volume_by_muscle = sets.values('exercise__muscle_group').annotate(
            total_volume=Sum(ExpressionWrapper(F('weight') * F('reps'), output_field=FloatField()))
        ).order_by('-total_volume')

        result = [
            {
                "muscle_group": item['exercise__muscle_group'],
                "total_volume": round(item['total_volume'], 2)
            }
            for item in volume_by_muscle if item['total_volume'] is not None
        ]
        return Response(result)


class WeeklyVolumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sets = completed_sets_for(request.user)
        weekly_volume = sets.annotate(
            week=TruncWeek('workout_session__date')
        ).values('week').annotate(
            total_volume=Sum(ExpressionWrapper(F('weight') * F('reps'), output_field=FloatField()))
        ).order_by('week')

        result = [
            {
                "week": item['week'].isoformat() if hasattr(item['week'], 'isoformat') else str(item['week']),
                "total_volume": round(item['total_volume'], 2)
            }
            for item in weekly_volume if item['total_volume'] is not None
        ]
        return Response(result)


class DailyVolumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        month_value = request.query_params.get("month")
        if month_value:
            try:
                target_month = datetime.datetime.strptime(month_value, "%Y-%m").date()
            except ValueError:
                return Response(
                    {"month": ["Use YYYY-MM format."]},
                    status=400,
                )
        else:
            target_month = datetime.date.today()

        daily_volume = completed_sets_for(request.user).filter(
            workout_session__date__year=target_month.year,
            workout_session__date__month=target_month.month,
        ).values("workout_session__date").annotate(
            total_volume=Sum(
                ExpressionWrapper(F("weight") * F("reps"), output_field=FloatField())
            )
        ).order_by("workout_session__date")

        return Response([
            {
                "date": item["workout_session__date"].isoformat(),
                "total_volume": round(item["total_volume"], 2),
            }
            for item in daily_volume
            if item["total_volume"] is not None
        ])


class MonthlyVolumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sets = completed_sets_for(request.user)
        monthly_volume = sets.annotate(
            month=TruncMonth('workout_session__date')
        ).values('month').annotate(
            total_volume=Sum(ExpressionWrapper(F('weight') * F('reps'), output_field=FloatField()))
        ).order_by('month')

        result = [
            {
                "month": item['month'].isoformat() if hasattr(item['month'], 'isoformat') else str(item['month']),
                "total_volume": round(item['total_volume'], 2)
            }
            for item in monthly_volume if item['total_volume'] is not None
        ]
        return Response(result)


class Estimated1RMView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exercise_id):
        sets = completed_sets_for(request.user).filter(
            exercise_id=exercise_id
        ).select_related('workout_session').order_by('workout_session__date')

        data = {}
        for s in sets:
            date_str = s.workout_session.date.isoformat()
            one_rm = s.weight * (1 + s.reps / 30.0) if s.reps > 1 else s.weight
            if date_str not in data or one_rm > data[date_str]:
                data[date_str] = one_rm

        progression = [{"date": k, "estimated_1rm": round(v, 2)} for k, v in sorted(data.items())]
        return Response(progression)


class BodyWeightTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = BodyWeightEntry.objects.filter(
            user=request.user
        ).order_by('date')

        result = [
            {
                "id": entry.id,
                "weight": entry.weight,
                "date": entry.date.isoformat()
            }
            for entry in entries
        ]
        return Response(result)


class BodyWeightRateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = datetime.date.today()
        thirty_days_ago = today - datetime.timedelta(days=30)

        entries = BodyWeightEntry.objects.filter(
            user=request.user,
            date__gte=thirty_days_ago
        ).order_by('date')

        if len(entries) < 2:
            latest = entries.last()
            return Response({
                "current_weight": latest.weight if latest else None,
                "starting_weight": entries.first().weight if entries.first() else None,
                "total_change": 0.0,
                "rate_per_week": 0.0,
                "message": "At least 2 entries in the last 30 days are required to calculate rate of change."
            })

        earliest = entries.first()
        latest = entries.last()

        weight_diff = latest.weight - earliest.weight
        days_diff = (latest.date - earliest.date).days

        rate_per_week = 0.0
        if days_diff > 0:
            rate_per_week = round(weight_diff / (days_diff / 7.0), 2)

        if rate_per_week < -0.1:
            message = f"You are losing weight at an average rate of {abs(rate_per_week)}kg per week."
        elif rate_per_week > 0.1:
            message = f"You are gaining weight at an average rate of {rate_per_week}kg per week."
        else:
            message = "Your weight is stable."

        return Response({
            "current_weight": latest.weight,
            "starting_weight": earliest.weight,
            "total_change": round(weight_diff, 2),
            "rate_per_week": rate_per_week,
            "message": message
        })
