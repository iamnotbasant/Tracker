import React, { useState, useEffect } from "react";
import { LogEntry, CategoryConfig, UserProfile, DEFAULT_CONFIG, DEFAULT_PROFILE } from "./types";
import BlueprintTab from "./components/BlueprintTab";
import ManageTab from "./components/ManageTab";
import InsightsTab from "./components/InsightsTab";
import ProfileTab from "./components/ProfileTab";
import LucideIcon from "./components/LucideIcon";
import AuthScreen from "./components/AuthScreen";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, orderBy, writeBatch } from "firebase/firestore";

const MOCK_LOGS: LogEntry[] = [
  {
    id: "mock_1",
    createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    mood: "happy",
    energy: "beast",
    resistance: "flow",
    fear: "fearless",
    activity: "exercise",
    note: "Finished a brilliant morning jog routine! High oxygen, high momentum, zero mental drag."
  },
  {
    id: "mock_2",
    createdAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString(),
    mood: "sad",
    energy: "low",
    resistance: "blocked",
    fear: "anxiety",
    activity: "social_media",
    note: "Fell into scrolling comparison trap on feed. Mind felt super foggy and sluggish afterward."
  },
  {
    id: "mock_3",
    createdAt: new Date(Date.now() - 2.0 * 24 * 60 * 60 * 1000).toISOString(),
    mood: "euphoric",
    energy: "beast",
    resistance: "flow",
    fear: "fearless",
    activity: "work",
    note: "Wrote the entire full-stack Express server binding without any errors. Flow feels invincible!"
  },
  {
    id: "mock_4",
    createdAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
    mood: "angry",
    energy: "low",
    resistance: "blocked",
    fear: "worried",
    activity: "ghar_ka_kaam",
    note: "Wasted hours fixing broken vacuum chores. Highly resistant to physical cleaning tasks today."
  },
  {
    id: "mock_5",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    mood: "happy",
    energy: "normal",
    resistance: "flow",
    fear: "fearless",
    activity: "meal",
    note: "Lunched with secondary teammates. Had healthy food options, recharged social battery!"
  }
];

type AppTab = "blueprint" | "manage" | "insights" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("blueprint");
  
  // Auth state management
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [useOfflineGuest, setUseOfflineGuest] = useState<boolean>(() => {
    return localStorage.getItem("mind_blueprint_guest_mode") === "true";
  });

  // Connection and automated synchronization states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showSyncNotification, setShowSyncNotification] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>("");

  // Core application configuration & metrics
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<CategoryConfig>(DEFAULT_CONFIG);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Global dark mode active state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("mind_blueprint_dark");
    return saved === "true";
  });

  // Toggle CSS dark mode root classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("mind_blueprint_dark", String(darkMode));
  }, [darkMode]);

  // Track the most recent log timestamp to bind timer
  const [lastLogTime, setLastLogTime] = useState<string | null>(null);

  useEffect(() => {
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLastLogTime(sorted[0].createdAt);
    } else {
      setLastLogTime(null);
    }
  }, [logs]);

  // Auth changed listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // Trigger automatic synchronizations when transition from Offline to Online occurs (Cloud Sync users)
  useEffect(() => {
    const handleStatusUpdate = async () => {
      const activeOnlineState = navigator.onLine;
      setIsOnline(activeOnlineState);

      if (activeOnlineState && firebaseUser) {
        const queueKey = `mind_blueprint_pending_cloud_sync_${firebaseUser.uid}`;
        const queueRaw = localStorage.getItem(queueKey);
        
        if (queueRaw) {
          try {
            const pendingLogs: LogEntry[] = JSON.parse(queueRaw);
            if (pendingLogs.length > 0) {
              const batch = writeBatch(db);
              for (const log of pendingLogs) {
                const logDocRef = doc(db, "users", firebaseUser.uid, "logs", log.id);
                batch.set(logDocRef, log);
              }
              await batch.commit();
              
              setSyncStatusMsg(`🌐 Connection Active! Auto-synced ${pendingLogs.length} offline blueprint records to Cloud.`);
              setShowSyncNotification(true);
              setTimeout(() => setShowSyncNotification(false), 4500);
            }
            localStorage.removeItem(queueKey);
          } catch (e) {
            console.error("Cloud offline sync processing failure: ", e);
          }
        }
      }
    };

    window.addEventListener("online", handleStatusUpdate);
    window.addEventListener("offline", handleStatusUpdate);

    // Run check immediately on load or when user shifts
    handleStatusUpdate();

    return () => {
      window.removeEventListener("online", handleStatusUpdate);
      window.removeEventListener("offline", handleStatusUpdate);
    };
  }, [firebaseUser]);

  // Sync profile, categories and logs from Firestore or LocalStorage Guest Cache
  useEffect(() => {
    // Automatic sync engine: if user logs in online, automatically sync any existing guest logs/configs!
    const syncLocalData = async (uid: string) => {
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      
      const localLogsRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_logs`) || localStorage.getItem("mind_blueprint_logs");
      const localConfigRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_config`) || localStorage.getItem("mind_blueprint_config");
      const localProfileRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_profile`) || localStorage.getItem("mind_blueprint_profile");

      let needsCommit = false;
      const batch = writeBatch(db);

      if (localLogsRaw) {
        try {
          const localLogs: LogEntry[] = JSON.parse(localLogsRaw);
          const nonMockLogs = localLogs.filter(log => log && log.id && !log.id.startsWith("mock_"));
          if (nonMockLogs.length > 0) {
            for (const log of nonMockLogs) {
              const logDocRef = doc(db, "users", uid, "logs", log.id);
              batch.set(logDocRef, log);
            }
            needsCommit = true;
          }
        } catch (e) {
          console.error("Failed to parse/sync offline logs", e);
        }
      }

      if (needsCommit) {
        await batch.commit().catch(err => {
          console.error("Batch sync failed: ", err);
        });
      }

      if (localConfigRaw) {
        try {
          const localConfig = JSON.parse(localConfigRaw);
          const userDocRef = doc(db, "users", uid);
          await setDoc(userDocRef, { config: localConfig }, { merge: true });
        } catch (e) {
          console.error("Failed to sync offline config", e);
        }
      }

      if (localProfileRaw) {
        try {
          const localProfile = JSON.parse(localProfileRaw);
          const userDocRef = doc(db, "users", uid);
          await setDoc(userDocRef, {
            name: localProfile.name,
            title: localProfile.title,
            avatarUrl: localProfile.avatarUrl,
            remindersEnabled: localProfile.remindersEnabled,
            reminderIntervalHours: localProfile.reminderIntervalHours
          }, { merge: true });
        } catch (e) {
          console.error("Failed to sync offline profile", e);
        }
      }

      // Clear the local cache to avoid duplicates in future logins
      localStorage.removeItem(`mind_blueprint_${activeLocalUser}_logs`);
      localStorage.removeItem(`mind_blueprint_${activeLocalUser}_config`);
      localStorage.removeItem(`mind_blueprint_${activeLocalUser}_profile`);
      localStorage.removeItem("mind_blueprint_logs");
      localStorage.removeItem("mind_blueprint_config");
      localStorage.removeItem("mind_blueprint_profile");
      localStorage.removeItem("mind_blueprint_guest_mode");
      setUseOfflineGuest(false);
    };

    if (!firebaseUser) {
      if (useOfflineGuest) {
        const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
        
        // Load offline profile config
        const localProfileRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_profile`) || localStorage.getItem("mind_blueprint_profile");
        if (localProfileRaw) {
          try {
            setProfile(JSON.parse(localProfileRaw));
          } catch (e) {
            console.error("Local profile read error: ", e);
          }
        } else {
          setProfile(DEFAULT_PROFILE);
        }

        // Load offline config categories
        const localConfigRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_config`) || localStorage.getItem("mind_blueprint_config");
        if (localConfigRaw) {
          try {
            setConfig(JSON.parse(localConfigRaw));
          } catch (e) {
            console.error("Local config read error: ", e);
          }
        } else {
          setConfig(DEFAULT_CONFIG);
        }

        // Load offline logbook entries
        const localLogsRaw = localStorage.getItem(`mind_blueprint_${activeLocalUser}_logs`) || localStorage.getItem("mind_blueprint_logs");
        if (localLogsRaw) {
          try {
            setLogs(JSON.parse(localLogsRaw));
          } catch (e) {
            console.error("Local logs read error: ", e);
          }
        } else {
          setLogs(MOCK_LOGS);
        }
      } else {
        setLogs([]);
        setProfile(DEFAULT_PROFILE);
        setConfig(DEFAULT_CONFIG);
      }
      return;
    }

    const userId = firebaseUser.uid;
    const userDocRef = doc(db, "users", userId);

    // Sync guest offline logged data once Firebase user authenticates!
    syncLocalData(userId);

    // Profile listener
    const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          name: data.name || DEFAULT_PROFILE.name,
          title: data.title || DEFAULT_PROFILE.title,
          avatarUrl: data.avatarUrl || DEFAULT_PROFILE.avatarUrl,
          remindersEnabled: data.remindersEnabled !== undefined ? data.remindersEnabled : DEFAULT_PROFILE.remindersEnabled,
          reminderIntervalHours: data.reminderIntervalHours !== undefined ? data.reminderIntervalHours : DEFAULT_PROFILE.reminderIntervalHours,
        });
        if (data.config) {
          setConfig(data.config);
        }
      } else {
        // Create initial default user profile document
        setDoc(userDocRef, {
          ...DEFAULT_PROFILE,
          config: DEFAULT_CONFIG,
          email: firebaseUser.email || "",
          createdAt: new Date().toISOString()
        }, { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    });

    // Logs listener (Firestore handles offline persistence transparently here!)
    const logsColRef = collection(db, "users", userId, "logs");
    const logsQuery = query(logsColRef, orderBy("createdAt", "desc"));

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs: LogEntry[] = [];
      snapshot.forEach((snapDoc) => {
        const d = snapDoc.data();
        fetchedLogs.push({
          id: snapDoc.id,
          createdAt: d.createdAt,
          mood: d.mood,
          energy: d.energy,
          resistance: d.resistance,
          fear: d.fear,
          activity: d.activity,
          note: d.note || ""
        });
      });

      // If online synced content is loaded, sync it to logs state
      setLogs(fetchedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/logs`);
    });

    return () => {
      unsubProfile();
      unsubLogs();
    };
  }, [firebaseUser, useOfflineGuest]);

  // CRUD operation callbacks matching Firestore structure
  const handleAddNewLog = async (newEntry: Omit<LogEntry, "id" | "createdAt" | "id"> & { note: string }) => {
    const logId = `log_${Date.now()}`;
    const logEntry: LogEntry = {
      ...newEntry,
      id: logId,
      createdAt: new Date().toISOString(),
    };

    if (firebaseUser) {
      if (!isOnline) {
        // Device is offline: place into the cloud sync queue and apply optimistically to state
        const queueKey = `mind_blueprint_pending_cloud_sync_${firebaseUser.uid}`;
        const queueRaw = localStorage.getItem(queueKey) || "[]";
        let currentQueue: LogEntry[] = [];
        try {
          currentQueue = JSON.parse(queueRaw);
        } catch (e) {
          currentQueue = [];
        }
        currentQueue.push(logEntry);
        localStorage.setItem(queueKey, JSON.stringify(currentQueue));

        // Update logs locally immediately for layout freshness
        setLogs((prev) => [logEntry, ...prev]);

        setSyncStatusMsg("📝 Saved offline! Added to Cloud Sync queue. Will upload automatically when internet is detected.");
        setShowSyncNotification(true);
        setTimeout(() => setShowSyncNotification(false), 5000);
      } else {
        const logDocRef = doc(db, "users", firebaseUser.uid, "logs", logId);
        await setDoc(logDocRef, logEntry).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/logs/${logId}`);
        });
      }
    } else {
      // Local storage sandbox
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      const updated = [logEntry, ...logs];
      setLogs(updated);
      localStorage.setItem(`mind_blueprint_${activeLocalUser}_logs`, JSON.stringify(updated));
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (firebaseUser) {
      const logDocRef = doc(db, "users", firebaseUser.uid, "logs", id);
      await deleteDoc(logDocRef).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/logs/${id}`);
      });
    } else {
      const updated = logs.filter((l) => l.id !== id);
      setLogs(updated);
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      localStorage.setItem(`mind_blueprint_${activeLocalUser}_logs`, JSON.stringify(updated));
    }
  };

  const handleUpdateConfig = async (newConfig: CategoryConfig) => {
    setConfig(newConfig);
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, { config: newConfig }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      });
    } else {
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      localStorage.setItem(`mind_blueprint_${activeLocalUser}_config`, JSON.stringify(newConfig));
    }
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, {
        name: newProfile.name,
        title: newProfile.title,
        avatarUrl: newProfile.avatarUrl,
        remindersEnabled: newProfile.remindersEnabled,
        reminderIntervalHours: newProfile.reminderIntervalHours
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      });
    } else {
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      localStorage.setItem(`mind_blueprint_${activeLocalUser}_profile`, JSON.stringify(newProfile));
    }
  };

  const handleImportLogs = async (importedLogs: LogEntry[], importedConfig?: CategoryConfig) => {
    if (firebaseUser) {
      const userId = firebaseUser.uid;
      const batchSizeLimit = 150;
      let batch = writeBatch(db);
      let writtenCount = 0;

      for (const log of importedLogs) {
        const cleanLog: LogEntry = {
          id: log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          createdAt: log.createdAt || new Date().toISOString(),
          mood: log.mood || "neutral",
          energy: log.energy || "normal",
          resistance: log.resistance || "flow",
          fear: log.fear || "fearless",
          activity: log.activity || "personal",
          note: log.note || ""
        };

        const docRef = doc(db, "users", userId, "logs", cleanLog.id);
        batch.set(docRef, cleanLog);
        writtenCount++;

        if (writtenCount >= batchSizeLimit) {
          await batch.commit();
          batch = writeBatch(db);
          writtenCount = 0;
        }
      }

      if (writtenCount > 0) {
        await batch.commit();
      }

      if (importedConfig) {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, { config: importedConfig }, { merge: true });
      }
    } else {
      setLogs(importedLogs);
      const activeLocalUser = localStorage.getItem("mind_blueprint_active_local_username") || "guest";
      localStorage.setItem(`mind_blueprint_${activeLocalUser}_logs`, JSON.stringify(importedLogs));
      if (importedConfig) {
        setConfig(importedConfig);
        localStorage.setItem(`mind_blueprint_${activeLocalUser}_config`, JSON.stringify(importedConfig));
      }
    }
  };

  const handleLogout = async () => {
    if (useOfflineGuest) {
      setUseOfflineGuest(false);
      localStorage.removeItem("mind_blueprint_guest_mode");
    } else {
      await signOut(auth).catch((err) => {
        console.error("Logout action failed: ", err);
      });
    }
  };

  // 1. Initial auth state resolving loader
  if (!authReady) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-200 ${
        darkMode ? "bg-[#121214] text-white" : "bg-slate-100 text-[#121c2a]"
      }`}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#eab308] rounded-full animate-spin"></div>
          <p className="text-sm font-black font-mono tracking-wider animate-pulse">
            LOADING MIND BLUEPRINT...
          </p>
        </div>
      </div>
    );
  }

  // 2. Authentication Gate: If firebaseUser is null and they haven't bypassed into guest mode, redirect to AuthScreen
  if (!firebaseUser && !useOfflineGuest) {
    return (
      <AuthScreen 
        darkMode={darkMode} 
        onEnterGuest={() => {
          setUseOfflineGuest(true);
          localStorage.setItem("mind_blueprint_guest_mode", "true");
        }} 
      />
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-0 flex flex-col items-center justify-start transition-colors duration-200 ${
      darkMode ? "bg-black text-[#f4f4f5]" : "bg-slate-100 text-[#121c2a]"
    } font-sans`}>
      {/* Device frame container mimics phone/tablet viewport gracefully on mobile, responsive full screen on desktop */}
      <div className={`w-full max-w-[480px] md:max-w-none md:w-full md:min-h-screen md:rounded-none md:border-0 md:shadow-none transition-colors duration-200 relative flex flex-col overflow-hidden pb-24 md:pb-24 ${
        darkMode 
          ? "bg-[#121214] border-[#2d2d30] shadow-[8px_8px_0_0_#000000]" 
          : "bg-[#f8f9ff] border-[#c7c4d7] shadow-[8px_8px_0_0_#d9e3f6]"
      }`}>
        
        {/* Dynamic Auto Sync Notification Ribbon */}
        {showSyncNotification && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide gap-2 shrink-0 animate-fade-in font-mono">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{syncStatusMsg}</span>
            </div>
            <button
              onClick={() => setShowSyncNotification(false)}
              className="text-emerald-500 dark:text-emerald-400 hover:opacity-75 text-[10px] font-black cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow px-4 sm:px-6 md:px-8 py-5 md:py-8 overflow-y-auto w-full">
          <div className="w-full max-w-7xl mx-auto">
            <React.Fragment>
              {activeTab === "blueprint" && (
                <BlueprintTab
                  config={config}
                  onLogEntry={handleAddNewLog}
                  lastLogTime={lastLogTime}
                  reminderIntervalHours={profile.reminderIntervalHours}
                />
              )}
              {activeTab === "manage" && (
                <ManageTab
                  config={config}
                  onUpdateConfig={handleUpdateConfig}
                />
              )}
              {activeTab === "insights" && (
                <InsightsTab
                  logs={logs}
                  config={config}
                />
              )}
              {activeTab === "profile" && (
                <ProfileTab
                  profile={profile}
                  logs={logs}
                  onUpdateProfile={handleUpdateProfile}
                  onImportLogs={handleImportLogs}
                  currentConfig={config}
                  darkMode={darkMode}
                  onToggleDarkMode={setDarkMode}
                  onDeleteLog={handleDeleteLog}
                  onLogout={handleLogout}
                  useOfflineGuest={useOfflineGuest}
                  onEnableCloudSync={() => {
                    setUseOfflineGuest(false);
                    localStorage.removeItem("mind_blueprint_guest_mode");
                  }}
                />
              )}
            </React.Fragment>
          </div>
        </main>

        {/* Tactile Bottom Navigation Bar containing exactly 4 items (History removed) */}
        <nav className={`absolute bottom-0 left-0 w-full z-45 border-t-2 items-center justify-between transition-colors duration-200 ${
          darkMode 
            ? "bg-[#121214] border-[#2d2d30]" 
            : "bg-[#ffffff] border-[#c7c4d7]"
        }`}>
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between px-2 py-2 gap-1">
            
            {/* Blueprint Tab button */}
            <button
              type="button"
              onClick={() => setActiveTab("blueprint")}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-100 cursor-pointer ${
                activeTab === "blueprint"
                  ? (darkMode ? "bg-[#1f1f21] text-[#eab308] font-black border border-[#eab308]/20" : "bg-[#121c2a] text-white font-black")
                  : "text-[#464554] dark:text-slate-400 hover:bg-[#f3f4f6]/60 dark:hover:bg-slate-800/40 font-medium"
              }`}
            >
              <LucideIcon name="edit_note" className="mb-0.5" size={20} />
              <span className="text-[10px] tracking-tight font-black uppercase">Blueprint</span>
            </button>

            {/* Manage Tab button */}
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-100 cursor-pointer ${
                activeTab === "manage"
                  ? (darkMode ? "bg-[#1f1f21] text-[#eab308] font-black border border-[#eab308]/20" : "bg-[#121c2a] text-white font-black")
                  : "text-[#464554] dark:text-slate-400 hover:bg-[#f3f4f6]/60 dark:hover:bg-slate-800/40 font-medium"
              }`}
            >
              <LucideIcon name="category" className="mb-0.5" size={20} />
              <span className="text-[10px] tracking-tight font-black uppercase">Manage</span>
            </button>

            {/* Insights Tab button */}
            <button
              type="button"
              onClick={() => setActiveTab("insights")}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-100 cursor-pointer ${
                activeTab === "insights"
                  ? (darkMode ? "bg-[#1f1f21] text-[#eab308] font-black border border-[#eab308]/20" : "bg-[#121c2a] text-white font-black")
                  : "text-[#464554] dark:text-slate-400 hover:bg-[#f3f4f6]/60 dark:hover:bg-slate-800/40 font-medium"
              }`}
            >
              <LucideIcon name="analytics" className="mb-0.5" size={20} />
              <span className="text-[10px] tracking-tight font-black uppercase">Insights</span>
            </button>

            {/* Profile Tab button */}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-100 cursor-pointer ${
                activeTab === "profile"
                  ? (darkMode ? "bg-[#1f1f21] text-[#eab308] font-black border border-[#eab308]/20" : "bg-[#121c2a] text-white font-black")
                  : "text-[#464554] dark:text-slate-400 hover:bg-[#f3f4f6]/60 dark:hover:bg-slate-800/40 font-medium"
              }`}
            >
              <LucideIcon name="person" className="mb-0.5" size={20} />
              <span className="text-[10px] tracking-tight font-black uppercase">Profile</span>
            </button>

          </div>
        </nav>
      </div>
    </div>
  );
}
