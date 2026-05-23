import React, { useState, useMemo } from "react";
import { LogEntry, CategoryConfig } from "../types";
import LucideIcon from "./LucideIcon";

interface InsightsTabProps {
  logs: LogEntry[];
  config: CategoryConfig;
}

export default function InsightsTab({ logs, config }: InsightsTabProps) {
  const totalLogs = logs.length;

  // State for active visualizations
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const [activeWaveIndex, setActiveWaveIndex] = useState<number | null>(null);

  // 1. Mood counting & Donut calculations
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.mood] = (counts[log.mood] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const moodDistribution = useMemo(() => {
    return config.moods.map((m) => {
      const count = moodCounts[m.id] || 0;
      const pct = totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0;
      return { ...m, count, pct };
    });
  }, [config.moods, moodCounts, totalLogs]);

  // Handle default active mood if none selected
  const sortedMoods = useMemo(() => {
    return [...moodDistribution].sort((a, b) => b.count - a.count);
  }, [moodDistribution]);

  const dominantMood = sortedMoods[0]?.count > 0 ? sortedMoods[0] : null;

  const currentSelectedMood = useMemo(() => {
    if (selectedMoodId) {
      return moodDistribution.find((m) => m.id === selectedMoodId) || dominantMood;
    }
    return dominantMood;
  }, [selectedMoodId, moodDistribution, dominantMood]);

  // Compute activities correlated with selected/dominant mood
  const moodCorrelations = useMemo(() => {
    if (!currentSelectedMood) return { topActivity: "N/A", percentage: 0, count: 0 };
    const moodLogs = logs.filter((l) => l.mood === currentSelectedMood.id);
    const totalMoodLogs = moodLogs.length;
    if (totalMoodLogs === 0) return { topActivity: "N/A", percentage: 0, count: 0 };

    const actCounts: Record<string, number> = {};
    moodLogs.forEach((l) => {
      actCounts[l.activity] = (actCounts[l.activity] || 0) + 1;
    });

    const sortedActs = Object.entries(actCounts).sort((a, b) => b[1] - a[1]);
    const topActId = sortedActs[0]?.[0];
    const topActCount = sortedActs[0]?.[1] || 0;
    const topActLabel = config.activities.find((a) => a.id === topActId)?.label || "Other Task";
    const percentage = Math.round((topActCount / totalMoodLogs) * 100);

    return {
      topActivity: topActLabel,
      percentage,
      count: topActCount,
    };
  }, [currentSelectedMood, logs, config.activities]);

  // 2. Calculated Mental Stamina Index
  const staminaMetrics = useMemo(() => {
    if (totalLogs === 0) return { score: 50, level: "Stable", description: "No logs registered yet." };
    const positiveCount = logs.filter(
      (l) => l.mood === "happy" || l.mood === "euphoric" || l.resistance === "flow"
    ).length;
    const criticalCount = logs.filter(
      (l) => l.mood === "angry" || l.mood === "sad" || l.resistance === "blocked"
    ).length;

    const positiveWeight = positiveCount * 1.0;
    const criticalWeight = criticalCount * 0.0;
    const neutralCount = totalLogs - positiveCount - criticalCount;
    const neutralWeight = neutralCount * 0.5;

    const score = Math.max(
      10,
      Math.min(100, Math.round(((positiveWeight + neutralWeight) / totalLogs) * 100))
    );

    let level = "Normal";
    let description = "Keep active logs to maintain battery readings, Bhai.";
    if (score >= 80) {
      level = "Beast Mode";
      description = "Your vibes and resistance flow are excellent. Keep pushing boundaries!";
    } else if (score >= 50 && score < 80) {
      level = "Optimized Flow";
      description = "Preserving focus well. Maintain 2-hour breaks to avoid burnout spikes.";
    } else {
      level = "Burnout Warning";
      description = "High friction recorded! Take 15 minutes off and do a breathing check-in.";
    }

    return { score, level, description };
  }, [logs, totalLogs]);

  // 3. Resistance level calculations
  const resCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.resistance] = (counts[log.resistance] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const resistanceStats = useMemo(() => {
    return config.resistances.map((r) => {
      const count = resCounts[r.id] || 0;
      const pct = totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0;
      return { ...r, count, pct };
    });
  }, [config.resistances, resCounts, totalLogs]);

  const sortedRes = useMemo(() => {
    return [...resistanceStats].sort((a, b) => b.count - a.count);
  }, [resistanceStats]);

  const dominantRes = sortedRes[0]?.count > 0 ? sortedRes[0] : null;

  // 4. Fear level calculations
  const fearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const fearVal = log.fear || "fearless";
      counts[fearVal] = (counts[fearVal] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const fearStats = useMemo(() => {
    return config.fears.map((f) => {
      const count = fearCounts[f.id] || 0;
      const pct = totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0;
      return { ...f, count, pct };
    });
  }, [config.fears, fearCounts, totalLogs]);

  const sortedFears = useMemo(() => {
    return [...fearStats].sort((a, b) => b.count - a.count);
  }, [fearStats]);

  const dominantFear = sortedFears[0]?.count > 0 ? sortedFears[0] : null;

  // 5. Time series: Last 12 check-ins format for Vibe Waves
  const recentLogs = useMemo(() => {
    return [...logs].slice(-12);
  }, [logs]);

  // Set default active timeline checkpoint node
  React.useEffect(() => {
    if (recentLogs.length > 0 && activeWaveIndex === null) {
      setActiveWaveIndex(recentLogs.length - 1);
    }
  }, [recentLogs, activeWaveIndex]);

  const selectedWaveLog = useMemo(() => {
    if (activeWaveIndex !== null && recentLogs[activeWaveIndex]) {
      return recentLogs[activeWaveIndex];
    }
    return null;
  }, [activeWaveIndex, recentLogs]);

  // Vibe Wave scoring scale helpers
  const getMoodScore = (moodId: string) => {
    switch (moodId) {
      case "euphoric": return 5;
      case "happy": return 4;
      case "neutral": return 3;
      case "upset": return 2;
      case "sad": return 1;
      case "angry": return 0;
      default: return 3;
    }
  };

  const getEnergyScore = (energyId: string) => {
    switch (energyId) {
      case "beast": return 4;
      case "normal": return 3;
      case "low": return 2;
      case "dead": return 1;
      default: return 2.5;
    }
  };

  // Convert timeline path points to coordinates for SVG width 380, height 110
  const wavePoints = useMemo(() => {
    if (recentLogs.length === 0) return { moodPath: "", energyPath: "", points: [] };
    const moodPts: { x: number; y: number }[] = [];
    const energyPts: { x: number; y: number }[] = [];

    const totalPoints = recentLogs.length;
    const chartWidth = 340;
    const chartHeight = 80;
    const xOffset = 20;
    const yOffset = 15;

    recentLogs.forEach((log, index) => {
      const x = totalPoints > 1 
        ? xOffset + (index / (totalPoints - 1)) * chartWidth 
        : xOffset + chartWidth / 2;

      // Mood score output coordinates
      const moodVal = getMoodScore(log.mood);
      const yMood = yOffset + (1 - moodVal / 5) * chartHeight;
      moodPts.push({ x, y: yMood });

      // Energy score output coordinates
      const energyVal = getEnergyScore(log.energy);
      const yEnergy = yOffset + (1 - (energyVal - 1) / 3) * chartHeight;
      energyPts.push({ x, y: yEnergy });
    });

    const moodPath = moodPts.map((p) => `${p.x},${p.y}`).join(" ");
    const energyPath = energyPts.map((p) => `${p.x},${p.y}`).join(" ");

    return { moodPath, energyPath, points: moodPts.map((p, i) => ({ ...p, energyY: energyPts[i].y, index: i })) };
  }, [recentLogs]);

  // 6. Act-vs-Resistance Grid Data (Correlation heatmap)
  const actResistanceMatrix = useMemo(() => {
    return config.activities.map((act) => {
      const actLogs = logs.filter((l) => l.activity === act.id);
      const total = actLogs.length;

      const flow = actLogs.filter((l) => l.resistance === "flow").length;
      const pushing = actLogs.filter((l) => l.resistance === "pushing").length;
      const blocked = actLogs.filter((l) => l.resistance === "blocked").length;

      const flowPct = total > 0 ? Math.round((flow / total) * 100) : 0;
      const pushPct = total > 0 ? Math.round((pushing / total) * 100) : 0;
      const blockedPct = total > 0 ? Math.round((blocked / total) * 100) : 0;

      return {
        ...act,
        total,
        flow,
        pushing,
        blocked,
        flowPct,
        pushPct,
        blockedPct,
      };
    }).filter((a) => a.total > 0);
  }, [config.activities, logs]);

  // 7. Friction Index analysis
  const frictionByActivity = useMemo(() => {
    return config.activities.map((act) => {
      const activityLogs = logs.filter((l) => l.activity === act.id);
      const totalActLogs = activityLogs.length;
      const highFrictionLogs = activityLogs.filter(
        (l) => l.resistance === "blocked" || l.resistance === "pushing" || l.mood === "angry" || l.mood === "sad" || l.mood === "upset"
      ).length;

      const frictionPct = totalActLogs > 0 ? Math.round((highFrictionLogs / totalActLogs) * 100) : 0;
      return {
        ...act,
        totalCount: totalActLogs,
        frictionCount: highFrictionLogs,
        pct: frictionPct,
      };
    }).filter((act) => act.totalCount > 0);
  }, [config.activities, logs]);

  const worstFrictionActivity = useMemo(() => {
    return [...frictionByActivity].sort((a, b) => b.pct - a.pct)[0];
  }, [frictionByActivity]);

  // Dynamic blueprint advice generator
  const dynamicBlueprintAdvice = useMemo(() => {
    if (totalLogs < 2) {
      return ["Log at least 2 checkpoints to trigger dynamic offline pattern analysis, Bhai!"];
    }

    let insightsList: string[] = [];

    if (dominantRes?.id === "blocked") {
      insightsList.push("Bhai, your Blocked resistance score is elevated. Break projects into 5-minute micro tasks to restart flow momentum.");
    } else if (dominantRes?.id === "pushing") {
      insightsList.push("You are in high-willpower 'Pushing' overdrive. Helpful, but burns focus speed. Take micro 10-minute pauses.");
    } else if (dominantRes?.id === "flow") {
      insightsList.push("Shabash! Focus conditions are highly optimized. Capture this trigger setting to preserve flow rhythms.");
    }

    if (dominantFear?.id === "anxiety") {
      insightsList.push("Subconscious Anxiety limits are high. Restrict screen distractions early during your daily check-ins.");
    } else if (dominantFear?.id === "worried") {
      insightsList.push("Results-focused worrying acts as friction. Shift your mindset completely to simple direct effort (Karma).");
    }

    if (worstFrictionActivity && worstFrictionActivity.pct > 35) {
      insightsList.push(`Routine Alert: '${worstFrictionActivity.label}' exhibits ${worstFrictionActivity.pct}% friction rate. Try to timebox it.`);
    }

    if (insightsList.length === 0) {
      insightsList.push("Your mind state readings reflect consistent flow balance. Continue frequent logging to secure records.");
    }

    return insightsList;
  }, [totalLogs, dominantRes, dominantFear, worstFrictionActivity]);

  // Dynamic status warnings
  const socialFrictionalCount = useMemo(() => {
    return logs.filter(
      (log) => log.activity === "social_media" && (log.resistance === "blocked" || log.mood === "sad" || log.mood === "angry")
    ).length;
  }, [logs]);

  // Calculate SVG Pie/Donut accumulated ring offset offsets
  const donutData = useMemo(() => {
    const circum = 2 * Math.PI * 40; // ~251.32
    let currentOffset = 0;

    return moodDistribution.map((m) => {
      const pct = m.pct;
      const strokeDashoffset = -currentOffset;
      const strokeDasharray = `${(pct / 100) * circum} ${circum}`;
      currentOffset += (pct / 100) * circum;

      let color = "#eab308";
      if (m.id === "angry") color = "#f97316";
      else if (m.id === "sad") color = "#3b82f6";
      else if (m.id === "upset") color = "#8b5cf6";
      else if (m.id === "neutral") color = "#64748b";
      else if (m.id === "happy") color = "#22c55e";
      else if (m.id === "euphoric") color = "#eab308";

      return { ...m, strokeDasharray, strokeDashoffset, color };
    });
  }, [moodDistribution]);

  return (
    <div className="space-y-6" id="insights-tab-root">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-[#121c2a] dark:text-white text-lg font-black tracking-tight flex items-center gap-1.5">
          <LucideIcon name="analytics" className="text-[#121c2a] dark:text-[#eab308]" size={20} />
          <span>Interactive Mind Insights</span>
        </h2>
        <p className="text-[#464554] dark:text-slate-350 text-xs font-medium">
          Tactile biometric charts, friction matrices & analytical waves
        </p>
      </div>

      {totalLogs === 0 ? (
        <div className="bg-[#f8f9ff] dark:bg-[#121214] rounded-xl p-6 text-center border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] text-[#464554] dark:text-slate-400">
          <div className="flex justify-center mb-1.5 animate-pulse">
            <LucideIcon name="analytics" className="text-[#121c2a] dark:text-[#eab308]" size={36} />
          </div>
          <p className="font-extrabold text-xs">Vibe analytical console is empty</p>
          <p className="text-[10px] text-[#767586] dark:text-slate-400 mt-0.5 max-w-[280px] mx-auto leading-normal">
            Bhai, log at least 1 checkpoint under the Blueprint dashboard to visualize interactive diagrams and emotional diagnostics!
          </p>
        </div>
      ) : (
        <>
          {/* Top Quick Stats + Mental Stamina Indicator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="insights-stats-grid">
            {/* Logged Card */}
            <div className="bg-slate-50 dark:bg-[#121214] border-2 border-[#121c2a] dark:border-[#2d2d30] p-4 rounded-xl shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000] flex flex-row items-center justify-between h-22 animate-fade-in relative overflow-hidden">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#464554] dark:text-slate-400">Logs Checked</span>
                <p className="text-3xl font-black text-[#121c2a] dark:text-white mt-1 leading-none">{totalLogs}</p>
              </div>
              <div className="w-11 h-11 bg-indigo-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-[#121c2a]/10 dark:border-zinc-700/50">
                <LucideIcon name="calendar_month" className="text-[#121c2a] dark:text-[#eab308]" size={22} />
              </div>
            </div>

            {/* Dominant Mood Badge */}
            <div className="bg-slate-50 dark:bg-[#121214] border-2 border-[#121c2a] dark:border-[#2d2d30] p-4 rounded-xl shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000] flex flex-row items-center justify-between h-22 animate-fade-in relative overflow-hidden">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#464554] dark:text-slate-400">Ruling Temper</span>
                <p className="text-xl font-black text-[#121c2a] dark:text-white mt-1 leading-none truncate">
                  {dominantMood ? dominantMood.label : "Neutral"}
                </p>
              </div>
              <div className="w-11 h-11 bg-amber-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-[#121c2a]/10 dark:border-zinc-700/50 shrink-0">
                <LucideIcon name={dominantMood?.icon || "mood"} className="text-amber-500" size={22} />
              </div>
            </div>

            {/* Stamina Meter Battery Card */}
            <div className="bg-slate-50 dark:bg-[#121214] border-2 border-[#121c2a] dark:border-[#2d2d30] p-4 rounded-xl shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000] flex items-center gap-3.5 h-22 animate-fade-in">
              {/* Vertical Battery Grid */}
              <div className="w-8 h-14 bg-white dark:bg-zinc-800 rounded-md border-2 border-[#121c2a] dark:border-zinc-700 relative p-0.5 flex flex-col justify-end overflow-hidden shrink-0">
                <div 
                  className="w-full rounded-xs transition-all duration-500"
                  style={{ 
                    height: `${staminaMetrics.score}%`,
                    backgroundColor: staminaMetrics.score >= 80 ? "#22c55e" : staminaMetrics.score >= 50 ? "#f59e0b" : "#ef4444"
                  }}
                />
                <div className="w-3 h-0.5 bg-[#121c2a] dark:bg-zinc-700 absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#464554] dark:text-slate-400">Mental Battery</span>
                <p className="text-sm font-extrabold text-[#121c2a] dark:text-white leading-tight mt-0.5 flex items-center gap-1.5">
                  <span>{staminaMetrics.score}%</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black text-white ${
                    staminaMetrics.score >= 80 ? "bg-emerald-600" : staminaMetrics.score >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}>{staminaMetrics.level}</span>
                </p>
                <p className="text-[8px] text-slate-550 dark:text-slate-400 truncate mt-0.5 leading-snug">
                  {staminaMetrics.description}
                </p>
              </div>
            </div>
          </div>

          {/* Friction / Scroll Warning Banner */}
          {socialFrictionalCount > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-[#d97706]/70 dark:border-[#d97706] rounded-xl p-3.5 flex gap-2.5 text-[#78350f] dark:text-orange-300 animate-fade-in">
              <LucideIcon name="warning" className="shrink-0 text-amber-500" size={18} />
              <div>
                <p className="font-extrabold text-xs tracking-tight">Social Media Drag Detected</p>
                <p className="text-[10px] opacity-90 mt-0.5 leading-normal">
                  You logged stressful or blocked mental states {socialFrictionalCount} time{socialFrictionalCount > 1 ? "s" : ""} during scrolling sessions. Control screen limits, Bhai.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Mood Donut Chart with Correlation focus */}
          <section className="bg-white dark:bg-[#121214] chunky-card border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-xl p-4.5 space-y-4 shadow-md">
            <div>
              <h3 className="font-black text-xs text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <LucideIcon name="analytics" size={14} className="text-[#eab308]" />
                <span>Mood Profile Ring</span>
              </h3>
              <p className="text-[10px] text-[#767586] dark:text-slate-400 mt-0.5">
                Click a section of the donut ring to calculate activity focus correlations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              {/* Donut SVG Ring */}
              <div className="flex justify-center relative py-1">
                <svg width="150" height="150" viewBox="0 0 120 120" className="drop-shadow-sm transform -rotate-90">
                  {/* Base Circle Spacer */}
                  <circle cx="60" cy="60" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-zinc-800" />
                  
                  {/* Sectors */}
                  {donutData.map((mood) => (
                    <circle
                      key={mood.id}
                      cx="60"
                      cy="60"
                      r="40"
                      fill="transparent"
                      stroke={mood.color}
                      strokeWidth={currentSelectedMood?.id === mood.id ? 15 : 11}
                      strokeDasharray={mood.strokeDasharray}
                      strokeDashoffset={mood.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer hover:stroke-[15px]"
                      onClick={() => setSelectedMoodId(mood.id)}
                    />
                  ))}

                  {/* Neubrutalist Center Borders */}
                  <circle cx="60" cy="60" r="46" fill="transparent" stroke="#121c2a" strokeWidth="1.5" className="dark:stroke-zinc-750" />
                  <circle cx="60" cy="60" r="34" fill="transparent" stroke="#121c2a" strokeWidth="1.5" className="dark:stroke-zinc-750" />
                </svg>

                {/* Central Readout inside Donut space */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl shrink-0">
                    {currentSelectedMood ? (
                      currentSelectedMood.id === "angry" ? "😡" :
                      currentSelectedMood.id === "sad" ? "😢" :
                      currentSelectedMood.id === "upset" ? "😔" :
                      currentSelectedMood.id === "neutral" ? "😐" :
                      currentSelectedMood.id === "happy" ? "🙂" : "😎"
                    ) : "📈"}
                  </span>
                  <span className="text-[11px] font-black text-[#121c2a] dark:text-white uppercase tracking-tight mt-0.5">
                    {currentSelectedMood ? currentSelectedMood.pct : 0}%
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                    {currentSelectedMood ? currentSelectedMood.label : "Vibes"}
                  </span>
                </div>
              </div>

              {/* Correlation Analysis Panel */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-transparent border border-transparent dark:border-zinc-800 p-3 sm:p-0 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-widest text-[#eab308] uppercase font-bold">Correlative Anchor</span>
                  <h4 className="text-sm font-black text-[#121c2a] dark:text-white flex items-center gap-1.5 leading-none">
                    <span>Vibe Profile:</span>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-black border text-white"
                      style={{ backgroundColor: currentSelectedMood ? (
                        currentSelectedMood.id === "angry" ? "#f97316" :
                        currentSelectedMood.id === "sad" ? "#3b82f6" :
                        currentSelectedMood.id === "upset" ? "#8b5cf6" :
                        currentSelectedMood.id === "neutral" ? "#64748b" :
                        currentSelectedMood.id === "happy" ? "#22c55e" : "#eab308"
                      ) : "#64748b", borderColor: "#121c2a" }}
                    >
                      {currentSelectedMood ? currentSelectedMood.label : "Neutral"}
                    </span>
                  </h4>
                </div>

                {moodCorrelations.count > 0 ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-white dark:bg-zinc-900 border-2 border-dashed border-[#121c2a] dark:border-zinc-800 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Key Habit Trigger</p>
                      <p className="text-xs text-[#121c2a] dark:text-slate-200 leading-normal">
                        Bhai, you check into <b>{currentSelectedMood?.label}</b> states mostly while engaged in <b>{moodCorrelations.topActivity}</b> ({moodCorrelations.percentage}% of logs).
                      </p>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      <div className="bg-amber-50 dark:bg-zinc-850 px-2 py-1 rounded border border-[#121c2a]/10 dark:border-zinc-800 flex items-center gap-1 text-[9px] font-black text-[#121c2a] dark:text-slate-300">
                        <span>Checkin Count:</span>
                        <span className="text-amber-600 font-bold">{currentSelectedMood?.count} log(s)</span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-zinc-850 px-2 py-1 rounded border border-[#121c2a]/10 dark:border-zinc-800 flex items-center gap-1 text-[9px] font-black text-[#121c2a] dark:text-slate-300">
                        <span>Habit Link:</span>
                        <span className="text-emerald-600 font-bold">{moodCorrelations.percentage}% strong</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">No correlation counts yet for this selection.</p>
                )}

                {/* Micro category selector buttons to toggle focus easily */}
                <div className="grid grid-cols-3 gap-1 pt-1.5">
                  {moodDistribution.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMoodId(m.id)}
                      className={`py-1 rounded border text-[9px] font-black uppercase tracking-tight text-center cursor-pointer transition-colors ${
                        currentSelectedMood?.id === m.id 
                          ? "bg-[#121c2a] dark:bg-[#eab308] text-white dark:text-[#121c2a] border-black font-extrabold"
                          : "bg-white dark:bg-zinc-900/40 text-slate-550 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Time Series: Chronological Vibe Waves (Line Chart) */}
          <section className="bg-white dark:bg-[#121214] chunky-card border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-xl p-4.5 space-y-4 shadow-md">
            <div>
              <h3 className="font-black text-xs text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <LucideIcon name="timeline" size={14} className="text-[#eab308]" />
                <span>Behavioral Vibe Waves</span>
              </h3>
              <p className="text-[10px] text-[#767586] dark:text-slate-400 mt-0.5">
                Recent 12 check-ins chronology tracking Energy Wave (dashed) and Mood Wave (solid). Click endpoints to query log notes.
              </p>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic pb-2 text-center">Add check-ins to view wave timelines, Bhai.</p>
            ) : (
              <div className="space-y-4">
                {/* SVG Polyline Chart Area */}
                <div className="w-full bg-[#fcfdfe] dark:bg-zinc-950 p-2.5 border border-[#121c2a]/10 dark:border-zinc-800 rounded-xl overflow-x-auto">
                  <svg width="380" height="110" viewBox="0 0 380 110" className="mx-auto block" style={{ minWidth: "340px" }}>
                    {/* SVG Filters for Neubrutalist Glow */}
                    <defs>
                      <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#e2e8f0" className="dark:fill-zinc-800" />
                      </pattern>
                    </defs>
                    {/* Background Dotted Matrix Grid */}
                    <rect width="380" height="110" fill="url(#grid-dots)" />
                    
                    {/* Horizontal separator grids */}
                    <line x1="15" y1="15" x2="365" y2="15" stroke="#121c2a" strokeWidth="0.5" strokeDasharray="2,5" className="opacity-20 dark:stroke-white" />
                    <line x1="15" y1="55" x2="365" y2="55" stroke="#121c2a" strokeWidth="0.5" strokeDasharray="2,5" className="opacity-20 dark:stroke-white" />
                    <line x1="15" y1="95" x2="365" y2="95" stroke="#121c2a" strokeWidth="0.5" strokeDasharray="2,5" className="opacity-20 dark:stroke-white" />

                    {/* Plot Line 1: Vibe Score Wave (Color: amber/Orange) */}
                    {wavePoints.moodPath && (
                      <polyline
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={wavePoints.moodPath}
                      />
                    )}

                    {/* Plot Line 2: Energy Score Wave (Color: Blue, dashed neubrutalist style) */}
                    {wavePoints.energyPath && (
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={wavePoints.energyPath}
                      />
                    )}

                    {/* Verticle Nodes Highlights */}
                    {wavePoints.points.map((pt) => {
                      const isActive = activeWaveIndex === pt.index;
                      return (
                        <g key={pt.index}>
                          {/* Vertical guide lines */}
                          <line
                            x1={pt.x}
                            y1="15"
                            x2={pt.x}
                            y2="95"
                            stroke={isActive ? "#121c2a" : "transparent"}
                            strokeWidth="1.5"
                            strokeDasharray="1,2"
                            className="dark:stroke-zinc-700"
                          />
                          {/* Mood Vertex Circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isActive ? 6 : 4}
                            fill={isActive ? "#d97706" : "#eab308"}
                            stroke="#121c2a"
                            strokeWidth="1.5"
                            className="cursor-pointer hover:r-7 transition-all duration-150"
                            onClick={() => setActiveWaveIndex(pt.index)}
                          />
                          {/* Energy Vertex Circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.energyY}
                            r={isActive ? 5.5 : 3.5}
                            fill={isActive ? "#2563eb" : "#93c5fd"}
                            stroke="#121c2a"
                            strokeWidth="1.5"
                            className="cursor-pointer hover:r-7 transition-all duration-150"
                            onClick={() => setActiveWaveIndex(pt.index)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Timeline Hover Nodes Readouts Display Container */}
                {selectedWaveLog && (
                  <div className="bg-slate-50 dark:bg-zinc-900/80 border-2 border-[#121c2a] dark:border-zinc-800 p-3.5 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center border-b pb-1.5 border-[#121c2a]/10 dark:border-zinc-800/80">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#464554] dark:text-slate-400 font-extrabold">
                        Timeline Node Details: Checkpoint #{ (activeWaveIndex || 0) + 1 }
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {new Date(selectedWaveLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedWaveLog.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#121c2a] dark:text-slate-200">
                        <LucideIcon name="mood" size={13} className="text-amber-500 shrink-0" />
                        <span className="truncate">Vibe: {config.moods.find(m => m.id === selectedWaveLog.mood)?.label || selectedWaveLog.mood}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#121c2a] dark:text-slate-200">
                        <LucideIcon name="bolt" size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">Energy: {config.energies.find(e => e.id === selectedWaveLog.energy)?.label || selectedWaveLog.energy}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#121c2a] dark:text-slate-200 col-span-1">
                        <LucideIcon name="work" size={13} className="text-purple-500 shrink-0" />
                        <span className="truncate">Task: {config.activities.find(a => a.id === selectedWaveLog.activity)?.label || selectedWaveLog.activity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#121c2a] dark:text-slate-200">
                        <LucideIcon name="waves" size={13} className="text-cyan-500 shrink-0" />
                        <span className="truncate">Flow: {config.resistances.find(r => r.id === selectedWaveLog.resistance)?.label || selectedWaveLog.resistance}</span>
                      </div>
                    </div>

                    {selectedWaveLog.note ? (
                      <div className="bg-white dark:bg-zinc-950 p-2 border border-slate-100 dark:border-zinc-800 text-[11px] text-[#464554] dark:text-slate-350 italic rounded-lg leading-relaxed">
                        &quot;{selectedWaveLog.note}&quot;
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-400 italic font-mono uppercase tracking-tight">No specific contextual focus notes written for this log.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Behavioral Correlation Matrix (Beats & Blocks Heatmap Matrix) */}
          <section className="bg-white dark:bg-[#121214] chunky-card border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-xl p-4.5 space-y-4 shadow-md">
            <div>
              <h3 className="font-black text-xs text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <LucideIcon name="view_module" size={14} className="text-[#eab308]" />
                <span>Flow Correlation Matrix</span>
              </h3>
              <p className="text-[10px] text-[#767586] dark:text-slate-400 mt-0.5">
                Matrix crossing activities with logged mental resistance states. High flow frequencies indicate healthy behavioral anchors.
              </p>
            </div>

            {actResistanceMatrix.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-2">No combination records logged yet, Bhai.</p>
            ) : (
              <div className="space-y-3.5 font-sans pt-1">
                {/* Table Grid Headers */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black uppercase text-slate-500 font-mono border-b pb-2 border-dashed border-[#121c2a]/10 dark:border-zinc-800">
                  <div className="text-left font-bold text-[#121c2a] dark:text-slate-350">Checked Action</div>
                  <div className="text-cyan-500">🌊 Flow</div>
                  <div className="text-amber-500 font-bold">⚡ Pushing</div>
                  <div className="text-red-500">🚫 Blocked</div>
                </div>

                {actResistanceMatrix.map((item) => (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-4 gap-2 items-center py-2 border-b border-dashed border-slate-100 dark:border-zinc-900/50 last:border-0 hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 rounded-lg px-0.5 transition-colors"
                  >
                    {/* Activity Title */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <LucideIcon name={item.icon} size={13} className="shrink-0 text-[#121c2a] dark:text-[#eab308]" />
                      <span className="font-extrabold text-[#121c2a] dark:text-white text-xs truncate leading-none">
                        {item.label}
                      </span>
                    </div>

                    {/* Flow Square */}
                    <div className="flex justify-center">
                      <span className={`w-10 py-1 rounded text-center text-[10px] font-black tracking-tight border ${
                        item.flowPct > 0 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" 
                          : "bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-750 border-transparent"
                      }`}>
                        {item.flowPct}%
                      </span>
                    </div>

                    {/* Pushing Square */}
                    <div className="flex justify-center">
                      <span className={`w-10 py-1 rounded text-center text-[10px] font-black tracking-tight border ${
                        item.pushPct > 0 
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" 
                          : "bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-750 border-transparent"
                      }`}>
                        {item.pushPct}%
                      </span>
                    </div>

                    {/* Blocked Square */}
                    <div className="flex justify-center">
                      <span className={`w-10 py-1 rounded text-center text-[10px] font-black tracking-tight border ${
                        item.blockedPct > 0 
                          ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50" 
                          : "bg-slate-50 dark:bg-zinc-900 text-slate-300 dark:text-zinc-750 border-transparent"
                      }`}>
                        {item.blockedPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* DYNAMIC OFFLINE BIOMETRICS & ACTION RECOMMENDATION COACH & DYNAMIC DIAGNOSIS */}
          <section className="bg-slate-50 dark:bg-[#161618] border-2 border-[#121c2a] dark:border-[#2d2d30] rounded-2xl p-4.5 shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000] space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#121214] border-2 border-[#121c2a] dark:border-[#2d2d30] flex items-center justify-center shrink-0 shadow-xs">
                <LucideIcon name="psychology" className="text-[#121c2a] dark:text-[#eab308]" size={24} />
              </div>
              <div>
                <h3 className="font-black text-xs text-[#121c2a] dark:text-white uppercase tracking-wide">Friction Diagnosis Coach</h3>
                <p className="text-[10px] text-[#464554] dark:text-slate-350 mt-0.5 leading-relaxed">
                  Calculated dynamically from your interactive state entries and routine friction parameters.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121214] border-2 border-slate-200 dark:border-[#2d2d30] rounded-xl p-3.5 space-y-2.5">
              <div className="space-y-2">
                {dynamicBlueprintAdvice.map((advice, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs text-[#121c2a] dark:text-slate-200 font-medium leading-relaxed border-b border-dashed border-slate-100 last:border-0 pb-2 last:pb-0">
                    <span className="text-[#121c2a] dark:text-[#eab308] font-extrabold text-sm shrink-0">🎯</span>
                    <p>{advice}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
