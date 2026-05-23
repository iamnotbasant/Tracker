import React from "react";
import {
  Frown,
  Meh,
  Smile,
  Laugh,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Zap,
  Ban,
  TrendingUp,
  Waves,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  Home,
  User,
  Smartphone,
  Utensils,
  Dumbbell,
  Users,
  Activity,
  Trash2,
  Menu,
  Settings,
  Timer,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Plane,
  Palette,
  Leaf,
  Dog,
  Brain,
  Sparkles,
  X,
  Bell,
  Clock,
  Search,
  Calendar,
  RotateCw,
  Moon,
  Upload,
  Share
} from "lucide-react";

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = "", size = 20 }: LucideIconProps) {
  // Convert material font icon names to Lucide icons
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Moods
    "sentiment_very_dissatisfied": Frown,
    "sentiment_dissatisfied": Frown,
    "sentiment_neutral": Meh,
    "sentiment_satisfied": Smile,
    "sentiment_very_satisfied": Laugh,
    
    // Energies
    "battery_0_bar": Battery,
    "battery_1_bar": BatteryLow,
    "battery_2_bar": BatteryLow,
    "battery_3_bar": BatteryMedium,
    "battery_4_bar": BatteryMedium,
    "bolt": Zap,
    "dead": Battery,
    "low": BatteryLow,
    "normal": BatteryMedium,
    "beast": Zap,

    // Resistances
    "block": Ban,
    "blocked": Ban,
    "trending_up": TrendingUp,
    "pushing": TrendingUp,
    "waves": Waves,
    "flow": Waves,

    // Fears
    "warning": AlertTriangle,
    "anxiety": AlertTriangle,
    "error_outline": AlertCircle,
    "worried": AlertCircle,
    "verified_user": ShieldCheck,
    "fearless": ShieldCheck,

    // Activities
    "work": Briefcase,
    "home": Home,
    "person": User,
    "smartphone": Smartphone,
    "restaurant": Utensils,
    "fitness_center": Dumbbell,
    "groups": Users,
    
    // Section headers & general
    "search": Search,
    "calendar_month": Calendar,
    "calendar_today": Calendar,
    "dark_mode": Moon,
    "upload_file": Upload,
    "ios_share": Share,
    "person_edit": User,
    "workspace_premium": Sparkles,
    "edit": Settings,
    "stars": Sparkles,
    "error": AlertCircle,
    "refresh": RotateCw,
    "edit_note": Brain,
    "category": Settings,
    "analytics": Sparkles,
    "notifications_active": Bell,
    "mood": Smile,
    "water": Waves,
    "gavel": AlertTriangle,
    "schedule": Clock,
    "timer": Timer,
    "check_circle": CheckCircle,
    "close": X,
    "help": HelpCircle,
    "school": BookOpen,
    "menu_book": BookOpen,
    "flight": Plane,
    "palette": Palette,
    "nature_people": Leaf,
    "pets": Dog,
    "self_improvement": Sparkles,
  };

  // Safe cleaner matching
  const key = name.toLowerCase().trim();
  const IconComponent = iconMap[key] || Activity;

  return <IconComponent className={className} size={size} />;
}
