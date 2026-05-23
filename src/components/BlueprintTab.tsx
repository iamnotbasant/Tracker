import React, { useState, useEffect } from "react";
import { CategoryConfig, LogEntry } from "../types";
import LucideIcon from "./LucideIcon";

interface BlueprintTabProps {
  config: CategoryConfig;
  onLogEntry: (entry: Omit<LogEntry, "id" | "createdAt"> & { note: string }) => void;
  lastLogTime: string | null;
  reminderIntervalHours: number;
}

export default function BlueprintTab({
  config,
  onLogEntry,
  lastLogTime,
  reminderIntervalHours,
}: BlueprintTabProps) {
  // State for selections
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedEnergy, setSelectedEnergy] = useState<string>("");
  const [selectedResistance, setSelectedResistance] = useState<string>("");
  const [selectedFear, setSelectedFear] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Toast alert dismiss state
  const [showToast, setShowToast] = useState<boolean>(true);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);

  // Countdown clock state
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    const calculateCountdown = () => {
      if (!lastLogTime) {
        // If no logs yet, allow immediately with no countdown lock
        setTimeLeft("00:00:00");
        setIsLocked(false);
        return;
      }

      const lastDate = new Date(lastLogTime);
      const targetDate = new Date(lastDate.getTime() + reminderIntervalHours * 60 * 60 * 1000);
      const diffMs = targetDate.getTime() - Date.now();

      if (diffMs <= 0) {
        setTimeLeft("00:00:00");
        setIsLocked(false);
        return;
      }

      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      setTimeLeft(formatted);
      setIsLocked(true);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastLogTime, reminderIntervalHours]);

  const handleLog = () => {
    if (isLocked) {
      alert(`Bhai, wait for the reminder countdown of 2 hours to complete! Remaining: ${timeLeft}`);
      return;
    }

    // Validate that at least Mood is selected
    if (!selectedMood) {
      alert("Bhai, please select your Mood to map your Mind Blueprint!");
      return;
    }

    onLogEntry({
      mood: selectedMood,
      energy: selectedEnergy || "normal",
      resistance: selectedResistance || "flow",
      fear: selectedFear || "fearless",
      activity: selectedActivity || "personal",
      note,
    });

    // Clear state with small tactile success visual flash
    setSuccessAnimation(true);
    setSelectedMood("");
    setSelectedEnergy("");
    setSelectedResistance("");
    setSelectedFear("");
    setSelectedActivity("");
    setNote("");

    setTimeout(() => {
      setSuccessAnimation(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-6 w-full" id="blueprint-panel">
      {/* Countdown Timer Widget Container */}
      <div className="bg-slate-50 dark:bg-[#121214] border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-xl p-4 flex items-center justify-between shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000]">
        <div className="flex items-center gap-2.5">
          <LucideIcon name="timer" className="text-[#121c2a] dark:text-[#eab308] shrink-0" size={22} />
          <span className="font-extrabold text-xs uppercase tracking-wide text-[#121c2a] dark:text-slate-200">Next Log In Reminder</span>
        </div>
        <span className="font-mono font-black text-[#121c2a] dark:text-[#eab308] text-lg tracking-wider">{timeLeft}</span>
      </div>

      {/* MOOD SECTION */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <LucideIcon name="mood" className="text-[#121c2a] dark:text-[#eab308]" size={14} /> Mood
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5" id="mood-grid">
          {config.moods.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-btn rounded-xl py-2.5 px-3 font-bold text-xs sm:text-sm md:text-sm md:py-3 md:px-5 md:w-auto md:min-w-[150px] md:flex-none flex items-center justify-center gap-2 relative ${option.colorClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-selected={selectedMood === option.id ? "true" : "false"}
              onClick={() => !isLocked && setSelectedMood(option.id)}
            >
              <LucideIcon name={option.icon} size={16} className="shrink-0" />
              <span className="truncate">{option.label}</span>
              {selectedMood === option.id && (
                <LucideIcon name="check_circle" className="absolute right-2 top-2 text-white shrink-0" size={12} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ENERGY SECTION */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <LucideIcon name="low" className="text-[#121c2a] dark:text-[#eab308]" size={14} /> Energy
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5" id="energy-grid">
          {config.energies.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-btn rounded-xl py-2.5 px-3 font-bold text-xs sm:text-sm md:text-sm md:py-3 md:px-5 md:w-auto md:min-w-[150px] md:flex-none flex items-center justify-center gap-2 relative ${option.colorClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-selected={selectedEnergy === option.id ? "true" : "false"}
              onClick={() => !isLocked && setSelectedEnergy(option.id)}
            >
              <LucideIcon name={option.icon} size={16} className="shrink-0" />
              <span className="truncate">{option.label}</span>
              {selectedEnergy === option.id && (
                <LucideIcon name="check_circle" className="absolute right-2 top-2 text-white shrink-0" size={12} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* RESISTANCE SECTION */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <LucideIcon name="water" className="text-[#121c2a] dark:text-[#eab308]" size={14} /> Resistance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5" id="resistance-grid">
          {config.resistances.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-btn rounded-xl py-2.5 px-2 font-bold text-xs sm:text-sm md:text-sm md:py-3 md:px-5 md:w-auto md:min-w-[150px] md:flex-none flex items-center justify-center gap-1.5 relative ${option.colorClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-selected={selectedResistance === option.id ? "true" : "false"}
              onClick={() => !isLocked && setSelectedResistance(option.id)}
            >
              <LucideIcon name={option.icon} size={14} className="shrink-0" />
              <span className="truncate">{option.label}</span>
              {selectedResistance === option.id && (
                <LucideIcon name="check_circle" className="absolute right-2 top-2 text-white shrink-0" size={12} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* FEAR SECTION */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <LucideIcon name="gavel" className="text-[#121c2a] dark:text-[#eab308]" size={14} /> Fear Level
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5" id="fear-grid">
          {config.fears.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-btn rounded-xl py-2.5 px-2 font-bold text-xs sm:text-sm md:text-sm md:py-3 md:px-5 md:w-auto md:min-w-[150px] md:flex-none flex items-center justify-center gap-1.5 relative ${option.colorClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-selected={selectedFear === option.id ? "true" : "false"}
              onClick={() => !isLocked && setSelectedFear(option.id)}
            >
              <LucideIcon name={option.icon} size={14} className="shrink-0" />
              <span className="truncate">{option.label}</span>
              {selectedFear === option.id && (
                <LucideIcon name="check_circle" className="absolute right-2 top-2 text-white shrink-0" size={12} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ACTIVITY SECTION */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <LucideIcon name="schedule" className="text-[#121c2a] dark:text-[#eab308]" size={14} /> Current Activity
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5" id="activity-grid">
          {config.activities.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`select-btn rounded-xl py-2.5 px-3 font-bold text-xs sm:text-sm md:text-sm md:py-3 md:px-5 md:w-auto md:min-w-[150px] md:flex-none flex items-center justify-center gap-2 relative ${option.colorClass} ${
                isLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-selected={selectedActivity === option.id ? "true" : "false"}
              onClick={() => !isLocked && setSelectedActivity(option.id)}
            >
              <LucideIcon name={option.icon} size={16} className="shrink-0" />
              <span className="truncate">{option.label}</span>
              {selectedActivity === option.id && (
                <LucideIcon name="check_circle" className="absolute right-2 top-2 text-white shrink-0" size={12} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ACTION LABELS / JOTTER */}
      <section className="space-y-1.5">
        <label htmlFor="log-note" className="text-[11px] font-black uppercase text-[#121c2a] dark:text-slate-300 tracking-wider block">
          Add Detail (What caused friction?)
        </label>
        <textarea
          id="log-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isLocked}
          placeholder={isLocked ? "Logging is locked until current 2-hour countdown expires." : "e.g. Brain feel foggy during writing, or got distracted reading social feed..."}
          rows={2}
          className={`w-full bg-white dark:bg-[#121214] text-[#121c2a] dark:text-white border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#121c2a] focus:ring-1 focus:ring-[#121c2a] dark:focus:border-[#eab308] dark:focus:ring-[#eab308] resize-none ${
            isLocked ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </section>

      {/* Dynamic Success banner */}
      {successAnimation && (
        <div className="p-2.5 bg-green-100 border border-green-400 text-green-700 text-xs font-bold rounded-xl text-center">
          🎉 Logged successfully! Blueprint calibrated.
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="pt-1.5">
        {isLocked ? (
          <button
            type="button"
            disabled={true}
            className="w-full rounded-xl py-3.5 font-extrabold bg-slate-100 dark:bg-[#161618] text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-[#2d2d30] text-center flex justify-center items-center gap-2 cursor-not-allowed shadow-inner transition-all duration-200"
          >
            <LucideIcon name="lock" size={16} />
            <span className="text-sm">Locked: Wait {timeLeft}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLog}
            className="log-btn w-full rounded-xl py-3.5 font-extrabold text-[#ffffff] text-center flex justify-center items-center gap-2 hover:bg-black active:translate-y-[2px] cursor-pointer"
          >
            <span className="text-sm">Log Data</span>
            <LucideIcon name="check_circle" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
