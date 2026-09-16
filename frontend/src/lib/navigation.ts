import {
  LayoutDashboard,
  Dumbbell,
  Activity,
  BookOpen,
  User,
} from "lucide-react";

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Workout",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    name: "Progress",
    href: "/analytics",
    icon: Activity,
  },
  {
    name: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];
