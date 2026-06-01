import {
  LayoutDashboard,
  Dumbbell,
  Activity,
  User,
} from "lucide-react";

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: Activity,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];
