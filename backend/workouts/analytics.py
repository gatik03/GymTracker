from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ExerciseSet


class TotalVolumeView(APIView):

    def get(self, request):

        total_volume = 0

        sets = ExerciseSet.objects.filter(
            workout_session__user=request.user
        )

        for workout_set in sets:

            total_volume += (
                workout_set.weight *
                workout_set.reps
            )

        return Response({
            "total_volume": total_volume
        })
