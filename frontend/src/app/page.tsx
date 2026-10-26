import { AppLayout } from "@/components/layout/AppLayout";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { MuscleDistribution } from "@/components/dashboard/MuscleDistribution";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Home() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl space-y-8">
        <DashboardHero />

        <StatsGrid />

        <VolumeChart />

        <div
          className="
            grid
            gap-6
            lg:grid-cols-2
          "
        >
          <MuscleDistribution />

          <RecentWorkouts />
        </div>
        <ActivityFeed />
      </main>
    </AppLayout>
  );
}
