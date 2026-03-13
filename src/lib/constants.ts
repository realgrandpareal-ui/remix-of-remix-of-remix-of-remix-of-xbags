import {
  Home,
  Compass,
  Bell,
  User,
  Trophy,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Referral", url: "/referral", icon: Users },
  { title: "Profile", url: "/profile/me", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export const MOBILE_NAV_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile/me", icon: User },
] as const;

export const APP_NAME = "xbags";
export const APP_TAGLINE = "Create. Connect. Earn.";
