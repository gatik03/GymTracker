import { AppLayout } from "@/components/layout/AppLayout";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <DashboardHero />

        <StatsGrid />
      </div>
    </AppLayout>
  );
}
