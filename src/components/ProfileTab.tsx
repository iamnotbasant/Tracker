import React, { useState } from "react";
import { UserProfile, LogEntry, CategoryConfig } from "../types";
import LucideIcon from "./LucideIcon";

interface ProfileTabProps {
  profile: UserProfile;
  logs: LogEntry[];
  onUpdateProfile: (p: UserProfile) => void;
  onImportLogs: (logs: LogEntry[], config?: CategoryConfig) => void;
  currentConfig: CategoryConfig;
  darkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
  onDeleteLog?: (id: string) => void;
  onLogout?: () => void;
  useOfflineGuest?: boolean;
  onEnableCloudSync?: () => void;
}

export default function ProfileTab({
  profile,
  logs,
  onUpdateProfile,
  onImportLogs,
  currentConfig,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onDeleteLog,
  useOfflineGuest,
  onEnableCloudSync,
}: ProfileTabProps) {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(profile.name);
  const [formTitle, setFormTitle] = useState(profile.title);

  // Collapsible logs archive list
  const [showLogbook, setShowLogbook] = useState(false);

  // Import file JSON helper messages
  const [importStatus, setImportStatus] = useState<string>("");

  // Export panel active state
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Filter & Format selections
  const [exportFilter, setExportFilter] = useState<"all" | "week" | "month" | "custom">("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  // Date selectors
  const [filterMonth, setFilterMonth] = useState(() => {
    return String(new Date().getMonth() + 1).padStart(2, "0");
  });
  const [filterYear, setFilterYear] = useState(() => {
    return String(new Date().getFullYear());
  });
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const MONTHS_LIST = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const YEARS_LIST = [String(currentYear), String(currentYear - 1), String(currentYear - 2)];

  // Calculate stats dynamically based on logs
  const calculateStats = () => {
    if (logs.length === 0) {
      return { daysLogged: 0, consistency: "0%", streak: "0 days" };
    }

    const dates = logs.map(
      (log) => new Date(log.createdAt).toISOString().split("T")[0]
    );
    const uniqueDays = new Set(dates).size;
    const displayConsistency = uniqueDays > 0 ? `${Math.min(100, 40 + uniqueDays * 8)}%` : "0%";

    const sortedDates = Array.from(new Set(dates)).sort();
    let currentStreak = 0;
    if (sortedDates.length > 0) {
      currentStreak = 1;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const d1 = new Date(sortedDates[i]);
        const d2 = new Date(sortedDates[i - 1]);
        const diffDays = (d1.getTime() - d2.getTime()) / (1000 * 30 * 24 * 60);
        if (diffDays <= 40 * 60) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      daysLogged: uniqueDays,
      consistency: uniqueDays > 0 ? displayConsistency : "0%",
      streak: `${currentStreak} day${currentStreak > 1 ? "s" : ""}`,
    };
  };

  const stats = calculateStats();

  const handleToggleDarkMode = (enabled: boolean) => {
    onToggleDarkMode(enabled);
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...profile,
      name: formName || "Alex River",
      title: formTitle || "Growth Enthusiast • Explorer Level 4",
    });
    setIsEditing(false);
  };

  // Compute records matches the filter values
  const getFilteredLogs = () => {
    return logs.filter((log) => {
      const logDate = new Date(log.createdAt);
      if (isNaN(logDate.getTime())) return false;

      if (exportFilter === "week") {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return logDate >= sevenDaysAgo && logDate <= now;
      }

      if (exportFilter === "month") {
        const logMonth = String(logDate.getMonth() + 1).padStart(2, "0");
        const logYear = String(logDate.getFullYear());
        return logMonth === filterMonth && logYear === filterYear;
      }

      if (exportFilter === "custom") {
        if (customStart) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
        return true;
      }

      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  // Primary Export trigger
  const handleDownloadExport = () => {
    if (filteredLogs.length === 0) {
      alert("Bhai, there are no matching friction logs found for this selected filter!");
      return;
    }

    if (exportFormat === "csv") {
      // Export formatted CSV
      const headers = ["Date", "Time", "Mood", "Energy", "Resistance", "Fear", "Activity", "Note"];
      const rows = filteredLogs.map((log) => {
        const dateObj = new Date(log.createdAt);
        const dateStr = dateObj.toLocaleDateString("en-GB");
        const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

        const moodLabel = currentConfig.moods.find((m) => m.id === log.mood)?.label || log.mood;
        const energyLabel = currentConfig.energies.find((e) => e.id === log.energy)?.label || log.energy;
        const resistanceLabel = currentConfig.resistances.find((r) => r.id === log.resistance)?.label || log.resistance;
        const fearLabel = currentConfig.fears.find((f) => f.id === log.fear)?.label || log.fear;
        const activityLabel = currentConfig.activities.find((a) => a.id === log.activity)?.label || log.activity;

        const noteClean = log.note ? `"${log.note.replace(/"/g, '""')}"` : "";

        return [
          dateStr,
          timeStr,
          moodLabel,
          energyLabel,
          resistanceLabel,
          fearLabel,
          activityLabel,
          noteClean,
        ].join(",");
      });

      const csvContent = "\ufeff" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `mind-blueprint-logs-${exportFilter}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Export raw configuration backup JSON
      const backupData = {
        mindBlueprintBackup: true,
        exportedAt: new Date().toISOString(),
        profile,
        logs: filteredLogs,
        config: currentConfig,
        filterUsed: exportFilter,
      };

      const str = JSON.stringify(backupData, null, 2);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `mind-blueprint-backup-${exportFilter}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    parseAndImportFile(files[0]);
  };

  const parseAndImportFile = (file: File) => {
    setImportStatus("");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && Array.isArray(parsed.logs)) {
          onImportLogs(parsed.logs, parsed.config);
          setImportStatus(`Success! Mapped ${parsed.logs.length} checkpoint logs.`);
        } else if (Array.isArray(parsed)) {
          onImportLogs(parsed);
          setImportStatus(`Success! Loaded ${parsed.length} raw entry logs.`);
        } else {
          setImportStatus("Error: Invalid JSON format. Missing log array.");
        }
      } catch (err) {
        setImportStatus("Error: Could not parse selected JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header Block */}
      <section className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#121c2a] dark:border-[#eab308] p-1 bg-white dark:bg-[#121214] shadow-[4px_4px_0px_0px_#d9e3f6] dark:shadow-[4px_4px_0px_0px_#000000]">
            <img
              alt="Alex Portrait"
              className="w-full h-full object-cover rounded-2xl"
              src={profile.avatarUrl}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="absolute -bottom-2 -right-2 bg-[#ac341b] text-white p-2 rounded-full border-2 border-white chunky-button shadow-md flex items-center justify-center cursor-pointer"
            title="Edit info"
          >
            <LucideIcon name="edit" size={16} />
          </button>
        </div>

        {isEditing ? (
          <div className="w-full bg-white dark:bg-[#121214] border-2 border-[#e6eeff] dark:border-[#2d2d30] p-4 rounded-2xl space-y-3 shadow-md text-left animate-fade-in">
            <h4 className="font-extrabold text-[#121c2a] dark:text-white text-xs uppercase tracking-wider">Edit Profile Card</h4>
            
            <div className="space-y-1">
              <label htmlFor="edit-name" className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Full Name</label>
              <input
                id="edit-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-[#f8f9ff] dark:bg-[#18181b] border border-[#c7c4d7] dark:border-[#2d2d30] text-[#121c2a] dark:text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#121c2a] dark:focus:border-[#eab308]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-title" className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Subtitle Tagline</label>
              <input
                id="edit-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-[#f8f9ff] dark:bg-[#18181b] border border-[#c7c4d7] dark:border-[#2d2d30] text-[#121c2a] dark:text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#121c2a] dark:focus:border-[#eab308]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 border border-[#c7c4d7] dark:border-[#475569] rounded-lg text-xs font-bold text-[#464554] dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-1.5 bg-[#121c2a] dark:bg-[#d97706] text-white rounded-lg text-xs font-bold border border-black/20"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="font-extrabold text-2xl text-[#121c2a] dark:text-white tracking-tight">{profile.name}</h1>
            <p className="text-[#464554]/80 dark:text-slate-300 text-xs font-bold tracking-tight uppercase mt-0.5">{profile.title}</p>
          </div>
        )}
      </section>

      {/* If using Offline local mode, show Connect Cloud Sync banner */}
      {useOfflineGuest && (
        <section className={`p-5 border-2 rounded-2xl text-left space-y-3 transition-all shadow-md ${
          darkMode 
            ? "bg-[#18181b] border-amber-500/30 text-white" 
            : "bg-[#fffbeb] border-[#fde047] text-amber-950"
        }`} id="connect-cloud-sync-card">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-[#d97706] dark:text-[#f59e0b] shrink-0 mt-0.5 animate-pulse">
              <LucideIcon name="cloud_queue" size={20} />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b45309] dark:text-amber-400">
                Offline Sandbox Mode
              </h4>
              <p className="text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Bhai, currently your logs are saved in this browser's local storage only. Tap below to register or log in online so your blueprint syncs automatically on all your devices!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEnableCloudSync}
            className="w-full h-10 bg-amber-500 hover:bg-amber-600 dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md uppercase tracking-wider active:translate-y-0.5"
          >
            <LucideIcon name="login" size={14} />
            <span>Connect Cloud Sync / Sign In</span>
          </button>
        </section>
      )}

      {/* Bento Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3" id="bento-stats">
        {/* Days Mapped Card */}
        <div className="bg-[#eff6ff] dark:bg-[#d97706] p-4 rounded-2xl border-2 border-[#bfdbfe] dark:border-transparent flex flex-col justify-between h-32 shadow-[4px_4px_0_0_#bfdbfe] dark:shadow-[4px_4px_0_0_#000000]">
          <LucideIcon name="calendar_today" className="text-[#1e40af] dark:text-white" size={28} />
          <div>
            <p className="text-2xl font-black text-[#1e40af] dark:text-white leading-none">
              {stats.daysLogged}
            </p>
            <p className="text-[10px] font-bold text-[#1e40af]/80 dark:text-white/85 uppercase tracking-wider">Days Mapped</p>
          </div>
        </div>

        {/* Consistency Card */}
        <div className="bg-[#f0fdf4] dark:bg-[#121214] p-4 rounded-2xl border-2 border-[#bbf7d0] dark:border-[#2d2d30] flex flex-col justify-between h-32 shadow-[4px_4px_0_0_#bbf7d0] dark:shadow-[4px_4px_0_0_#000000]">
          <LucideIcon name="bolt" className="text-[#15803d] dark:text-[#eab308]" size={28} />
          <div>
            <p className="text-2xl font-black text-[#15803d] dark:text-white leading-none">
              {stats.consistency}
            </p>
            <p className="text-[10px] font-bold text-[#15803d]/80 dark:text-slate-350 uppercase tracking-wider">Consistency</p>
          </div>
        </div>

        {/* Daily Streak Card */}
        <div className="col-span-2 lg:col-span-1 bg-[#fffaf5] dark:bg-[#121214] p-4 rounded-2xl border-2 border-[#fed7aa] dark:border-[#2d2d30] shadow-[4px_4px_0_0_#fed7aa] dark:shadow-[4px_4px_0_0_#000000] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffe07c] border-2 border-[#b45309] flex items-center justify-center shrink-0">
              <LucideIcon name="workspace_premium" className="text-[#725c00]" size={20} />
            </div>
            <div>
              <p className="font-extrabold text-[#c2410c] dark:text-white text-sm">Daily Streak</p>
              <p className="text-xs text-[#c2410c] dark:text-slate-350 font-bold">
                {logs.length > 0 ? `${stats.streak} days!` : "0 days"}
              </p>
            </div>
          </div>
          <div className="flex -space-x-2 shrink-0">
            <div className="w-6.5 h-6.5 rounded-full bg-[#121c2a] dark:bg-[#eab308] border-2 border-white shadow-xs"></div>
            <div className="w-6.5 h-6.5 rounded-full bg-[#fd6f50] border-2 border-white shadow-xs"></div>
          </div>
        </div>
      </section>

      {/* PROFESSIONAL PORTABLE DATA EXPORT CONSOLE */}
      <section className="bg-white dark:bg-[#121214] border-2 border-slate-200 dark:border-[#2d2d30] rounded-2xl p-4.5 shadow-[4px_4px_0_0_#ebdcfc] dark:shadow-[4px_4px_0_0_#000000] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <LucideIcon name="download" size={16} className="text-[#121c2a] dark:text-[#eab308]" />
              <span>Export Records</span>
            </h2>
          </div>
          
          <button
            type="button"
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-tight cursor-pointer border shadow-[2px_2px_0_0_#dddddd] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#dddddd] transition-all flex items-center gap-1 ${
              showExportPanel 
                ? "bg-[#fd6f50] text-white border-orange-700"
                : "bg-[#eff4ff] dark:bg-[#1a1a1c] text-[#121c2a] dark:text-slate-350 border-slate-200 dark:border-[#2d2d30]"
            }`}
          >
            <span>{showExportPanel ? "Hide Filters" : "Set Options"}</span>
            <LucideIcon name={showExportPanel ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={14} />
          </button>
        </div>

        {/* Configuration area */}
        {showExportPanel ? (
          <div className="space-y-4 border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 animate-fade-in">
            {/* Format selection block */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">File Format</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                    exportFormat === "csv"
                      ? "bg-[#eff4ff] dark:bg-[#252529] text-[#121c2a] dark:text-white border-black dark:border-[#eab308] font-black"
                      : "bg-slate-50 dark:bg-[#18181b] text-slate-500 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <LucideIcon name="table_view" size={14} />
                  <span>CSV Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                    exportFormat === "json"
                      ? "bg-[#eff4ff] dark:bg-[#252529] text-[#121c2a] dark:text-white border-black dark:border-[#eab308] font-black"
                      : "bg-slate-50 dark:bg-[#18181b] text-slate-500 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <LucideIcon name="code" size={14} />
                  <span>JSON File</span>
                </button>
              </div>
            </div>

            {/* Date Sorter range selection */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Filter Range</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["all", "week", "month", "custom"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setExportFilter(mode)}
                    className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight text-center cursor-pointer border ${
                      exportFilter === mode
                        ? "bg-[#121c2a] dark:bg-[#d97706] text-white border-black"
                        : "bg-slate-50 dark:bg-[#18181b] text-[#464554] dark:text-slate-300 border-[#c7c4d7] dark:border-slate-800"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional input fields */}
            {exportFilter === "month" && (
              <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-[#c7c4d7] dark:border-[#2d2d30] flex gap-3 items-center justify-between animate-fade-in">
                <div className="flex-1 flex flex-col space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-550">Pick Month</span>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-white dark:bg-[#252529] border border-black/10 dark:border-[#2d2d30] text-xs p-1.5 rounded-md font-bold text-[#121c2a] dark:text-white focus:outline-none"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-555">Pick Year</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-white dark:bg-[#252529] border border-black/10 dark:border-[#2d2d30] text-xs p-1.5 rounded-md font-bold text-[#121c2a] dark:text-white focus:outline-none"
                  >
                    {YEARS_LIST.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {exportFilter === "custom" && (
              <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-[#c7c4d7] dark:border-[#2d2d30] grid grid-cols-2 gap-2 animate-fade-in">
                <div className="flex flex-col space-y-0.5">
                  <label htmlFor="exp-custom-start" className="text-[9px] uppercase font-black text-slate-500 font-mono">Start Date</label>
                  <input
                    id="exp-custom-start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-white dark:bg-[#252529] border border-black/10 dark:border-[#2d2d30] text-xs p-1 rounded-md text-[#121c2a] dark:text-white font-mono"
                  />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <label htmlFor="exp-custom-end" className="text-[9px] uppercase font-black text-slate-500 font-mono">End Date</label>
                  <input
                    id="exp-custom-end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-white dark:bg-[#252529] border border-black/10 dark:border-[#2d2d30] text-xs p-1 rounded-md text-[#121c2a] dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadExport}
              className="w-full h-11 bg-[#121c2a] dark:bg-[#d97706] text-white font-extrabold text-xs rounded-xl border-b-4 border-black dark:border-[#b45309] active:translate-y-0.5 active:border-b-2 chunky-button flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <LucideIcon name="download" size={14} />
              <span>Download Sorted {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#18181b] rounded-xl p-4 text-center border border-dashed border-slate-200 dark:border-[#2d2d30]">
            <LucideIcon name="folder_zip" className="text-slate-450 mx-auto mb-1" size={24} />
            <p className="text-xs font-bold text-[#121c2a] dark:text-white">Filters Configured Off</p>
            <p className="text-[10px] text-slate-500">Click <b>Set Options</b> above to choose timeframe selections and file formats.</p>
          </div>
        )}
      </section>

      {/* Collapsible live log logbook list */}
      <section className="bg-white dark:bg-[#121214] border-2 border-slate-200 dark:border-[#2d2d30] rounded-2xl p-4.5 shadow-[4px_4px_0_0_#e2e8f0] dark:shadow-[4px_4px_0_0_#000000] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <LucideIcon name="history" size={16} className="text-[#121c2a] dark:text-[#eab308]" />
            <span>Live Logbook ({logs.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowLogbook(!showLogbook)}
            className="text-xs font-black text-[#121c2a] dark:text-[#eab308] hover:underline cursor-pointer font-sans"
          >
            {showLogbook ? "Collapse" : "Show Entries"}
          </button>
        </div>

        {showLogbook && (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 animate-fade-in divide-y-2 divide-dashed divide-slate-100 dark:divide-zinc-800">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 font-mono">Bhai, no logs are registered yet.</p>
            ) : (
              logs.map((log, index) => {
                const moodObj = currentConfig.moods.find((m) => m.id === log.mood);
                const actObj = currentConfig.activities.find((a) => a.id === log.activity);
                const dateObj = new Date(log.createdAt);
                const dateString = isNaN(dateObj.getTime())
                  ? "Raw Timestamp"
                  : dateObj.toLocaleDateString("en-GB") + " • " + dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={log.id} className={`flex items-start justify-between gap-3 text-xs ${index > 0 ? "pt-3" : ""}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${moodObj?.bgClass || "bg-indigo-50/50 text-[#121c2a]"}`}>
                          {moodObj?.label || log.mood}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${actObj?.bgClass || "bg-indigo-50/50 text-[#121c2a]"}`}>
                          {actObj?.label || log.activity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{dateString}</span>
                      </div>
                      {log.note ? (
                        <p className="text-[#121c2a]/95 dark:text-slate-200 mt-1 leading-relaxed antialiased font-medium">{log.note}</p>
                      ) : (
                        <p className="text-[11px] text-slate-450 italic">No notes annotated.</p>
                      )}
                    </div>
                    {onDeleteLog && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this log entry permanently from the database?")) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="p-1 px-2 border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-[#202022] hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 hover:text-red-700 transition-all cursor-pointer shadow-sm"
                        title="Delete log permanently"
                      >
                        <LucideIcon name="delete" size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Settings Options list */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-[#121c2a] dark:text-white uppercase tracking-wider">Settings</h2>
        <div className="space-y-2">
          {/* Reminders Toggle Switch */}
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border-2 border-[#e6eeff] dark:border-[#2d2d30] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#121c2a] dark:text-white">
              <LucideIcon name="notifications_active" className="text-slate-500 dark:text-slate-400" size={18} />
              <span className="font-semibold text-sm">2-Hour Reminders</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.remindersEnabled}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, remindersEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#eab308]" />
            </label>
          </div>

          {/* Theme selection toggle */}
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border-2 border-[#e6eeff] dark:border-[#2d2d30] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#121c2a] dark:text-white">
              <LucideIcon name="dark_mode" className="text-slate-500 dark:text-slate-400" size={18} />
              <span className="font-semibold text-sm">Dark/Black Theme</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => handleToggleDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#eab308]" />
            </label>
          </div>
        </div>
      </section>

      {/* Backup and restore JSON components */}
      <section className="bg-white dark:bg-[#121214] chunky-card rounded-2xl p-4 space-y-3">
        {/* Drag and Drop Zone Input */}
        <div className="border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] rounded-xl p-3 text-center cursor-pointer relative bg-[#f8f9ff] dark:bg-[#18181b] flex items-center justify-center gap-2">
          <LucideIcon name="upload_file" className="text-slate-500 dark:text-slate-400" size={18} />
          <span className="text-xs font-bold text-[#121c2a] dark:text-white font-sans uppercase tracking-tight">Import JSON Backup</span>
          <input
            id="json-file-input"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {importStatus && (
          <div className="p-2 text-center text-xs font-bold text-[#121c2a] dark:text-[#eab308] bg-indigo-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2d2d30] rounded-lg">
            {importStatus}
          </div>
        )}
      </section>

      {/* Actions screen row chunky button styling */}
      <section className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full h-12 bg-[#121c2a] dark:bg-[#d97706] text-[#ffffff] font-extrabold text-xs rounded-xl border-b-4 border-black dark:border-[#b45309] chunky-button flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#121c2a]"
        >
          <LucideIcon name="person_edit" size={14} />
          Edit User Profile Card
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-12 bg-red-600 dark:bg-[#dc2626] text-white font-black text-xs rounded-xl border-b-4 border-red-800 dark:border-red-955 active:translate-y-0.5 active:border-b-2 chunky-button flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#991b1b]"
          >
            <LucideIcon name="logout" size={14} />
            LOG OUT DEVICE
          </button>
        )}
      </section>
    </div>
  );
}
