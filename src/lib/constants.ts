import {
  Home,
  Compass,
  Bell,
  User,
  Trophy,
  BarChart3,
  Users,
  HelpCircle,
  Newspaper,
} from "lucide-react";

export const NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: Newspaper },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Referral", url: "/referral", icon: Users },
  { title: "How It Works", url: "/how-it-works", icon: HelpCircle },
] as const;

export const MOBILE_NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: Newspaper },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile/me", icon: User },
] as const;

export const APP_NAME = "CreatorSpace";
