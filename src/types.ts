export interface LogEntry {
  id: string;
  createdAt: string; // ISO Timestamp
  mood: string;       // ID of selected mood
  energy: string;     // ID of selected energy
  resistance: string; // ID of selected resistance
  fear: string;       // ID of selected fear
  activity: string;   // ID of selected activity
  note?: string;      // Optional user note
}

export interface CategoryOption {
  id: string;
  label: string;
  icon: string;
  colorClass: string; // e.g., 'angry', 'sad', 'activity-work'
  bgClass?: string;   // background color during preview / card badges, e.g. 'bg-error-container text-on-error-container'
}

export interface CategoryConfig {
  moods: CategoryOption[];
  energies: CategoryOption[];
  resistances: CategoryOption[];
  fears: CategoryOption[];
  activities: CategoryOption[];
}

export interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
  remindersEnabled: boolean;
  reminderIntervalHours: number;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "Alex River",
  title: "Growth Enthusiast • Explorer Level 4",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKUgdSECxR-AAXl7jy_OnQ9cV1PRrWrfaUkBBugddYOGsWQKMgbBXJh-XQq2qby52yR68Wm3mY63yLEgnOl5fkSUTr8IqaN_NQ3iD4J7gNUJcevF7v9pofcqzsuE8ZRybsj5BERv0XtTJJ0nr06b23Ed0UL3bePqaAhcs1IsR4KWGVbmxCHcVuyXy_S7FeIgM3k-JYQIp36-LJrackRa-TCRAfo0BTuB1ct7MZY51Lg2DR8uv4gyec8AUkMsWXRmFhfcTQgOtEytvA",
  remindersEnabled: true,
  reminderIntervalHours: 2,
};

export const DEFAULT_CONFIG: CategoryConfig = {
  moods: [
    { id: "angry", label: "Angry", icon: "sentiment_very_dissatisfied", colorClass: "angry", bgClass: "bg-orange-100 text-orange-700" },
    { id: "sad", label: "Sad", icon: "sentiment_dissatisfied", colorClass: "sad", bgClass: "bg-blue-100 text-blue-700" },
    { id: "upset", label: "Upset", icon: "sentiment_neutral", colorClass: "upset", bgClass: "bg-purple-100 text-purple-700" },
    { id: "neutral", label: "Neutral", icon: "sentiment_neutral", colorClass: "neutral", bgClass: "bg-slate-100 text-slate-700" },
    { id: "happy", label: "Happy", icon: "sentiment_satisfied", colorClass: "happy", bgClass: "bg-green-100 text-green-700" },
    { id: "euphoric", label: "Euphoric", icon: "sentiment_very_satisfied", colorClass: "euphoric", bgClass: "bg-yellow-100 text-yellow-700" }
  ],
  energies: [
    { id: "dead", label: "Dead", icon: "battery_0_bar", colorClass: "dead", bgClass: "bg-gray-100 text-gray-700" },
    { id: "low", label: "Low", icon: "battery_2_bar", colorClass: "low", bgClass: "bg-amber-100 text-amber-700" },
    { id: "normal", label: "Normal", icon: "battery_4_bar", colorClass: "normal", bgClass: "bg-sky-100 text-sky-700" },
    { id: "beast", label: "Beast", icon: "bolt", colorClass: "beast", bgClass: "bg-red-100 text-red-700" }
  ],
  resistances: [
    { id: "blocked", label: "Blocked", icon: "block", colorClass: "blocked", bgClass: "bg-red-100 text-red-600" },
    { id: "pushing", label: "Pushing", icon: "trending_up", colorClass: "pushing", bgClass: "bg-amber-100 text-amber-600" },
    { id: "flow", label: "Flow", icon: "waves", colorClass: "flow", bgClass: "bg-cyan-100 text-cyan-600" }
  ],
  fears: [
    { id: "anxiety", label: "Anxiety", icon: "warning", colorClass: "anxiety", bgClass: "bg-violet-100 text-violet-700" },
    { id: "worried", label: "Worried", icon: "error_outline", colorClass: "worried", bgClass: "bg-amber-100 text-amber-600" },
    { id: "fearless", label: "Fearless", icon: "verified_user", colorClass: "fearless", bgClass: "bg-green-100 text-green-700" }
  ],
  activities: [
    { id: "work", label: "Work", icon: "work", colorClass: "activity-work", bgClass: "bg-indigo-100 text-indigo-700" },
    { id: "ghar_ka_kaam", label: "Ghar ka kaam", icon: "home", colorClass: "activity-ghar", bgClass: "bg-teal-100 text-teal-700" },
    { id: "personal", label: "Personal", icon: "person", colorClass: "activity-personal", bgClass: "bg-purple-100 text-purple-700" },
    { id: "social_media", label: "Social Media", icon: "smartphone", colorClass: "activity-scrolling", bgClass: "bg-rose-100 text-rose-700" },
    { id: "meal", label: "Meal", icon: "restaurant", colorClass: "activity-meal", bgClass: "bg-orange-100 text-orange-700" },
    { id: "exercise", label: "Exercise", icon: "fitness_center", colorClass: "activity-exercise", bgClass: "bg-emerald-100 text-emerald-700" },
    { id: "social", label: "Social", icon: "groups", colorClass: "activity-social", bgClass: "bg-pink-100 text-pink-700" }
  ]
};

export const AVAILABLE_ICONS = [
  "sentiment_very_dissatisfied", "sentiment_dissatisfied", "sentiment_neutral", "sentiment_satisfied", "sentiment_very_satisfied",
  "battery_0_bar", "battery_1_bar", "battery_2_bar", "battery_3_bar", "battery_4_bar", "bolt", "block", "trending_up", "waves",
  "warning", "error_outline", "verified_user", "work", "home", "person", "smartphone", "restaurant", "fitness_center", "groups",
  "local_hospital", "school", "menu_book", "flight", "palette", "nature_people", "pets", "psychology", "self_improvement"
];

export const AVAILABLE_COLORS = [
  { id: "angry", label: "Orange-Red", color: "#f97316" },
  { id: "sad", label: "Blue", color: "#3b82f6" },
  { id: "upset", label: "Purple", color: "#8b5cf6" },
  { id: "neutral", label: "Slate Grey", color: "#64748b" },
  { id: "happy", label: "Green", color: "#22c55e" },
  { id: "euphoric", label: "Yellow", color: "#eab308" },
  { id: "dead", label: "Dark Gray", color: "#4b5563" },
  { id: "low", label: "Amber", color: "#f59e0b" },
  { id: "normal", label: "Sky Blue", color: "#0ea5e9" },
  { id: "beast", label: "Red", color: "#ef4444" },
  { id: "blocked", label: "Crimson", color: "#ef4444" },
  { id: "pushing", label: "Orange", color: "#f59e0b" },
  { id: "flow", label: "Cyan", color: "#06b6d4" },
  { id: "anxiety", label: "Amethyst Purple", color: "#8b5cf6" },
  { id: "worried", label: "Bright Amber", color: "#f59e0b" },
  { id: "fearless", label: "Mint Green", color: "#22c55e" },
  { id: "activity-work", label: "Work Indigo", color: "#6366f1" },
  { id: "activity-ghar", label: "Home Teal", color: "#14b8a6" },
  { id: "activity-personal", label: "Personal Amethyst", color: "#8b5cf6" },
  { id: "activity-scrolling", label: "Scrolling Rose", color: "#f43f5e" },
  { id: "activity-meal", label: "Meal Peach", color: "#fb923c" },
  { id: "activity-exercise", label: "Exercise Green", color: "#4ade80" },
  { id: "activity-social", label: "Social Pink", color: "#f472b6" }
];
