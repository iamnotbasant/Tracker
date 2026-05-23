import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_PROFILE, DEFAULT_CONFIG } from "../types";
import LucideIcon from "./LucideIcon";

interface AuthScreenProps {
  darkMode: boolean;
  onEnterGuest?: () => void;
}

export default function AuthScreen({ darkMode, onEnterGuest }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userVal, setUserVal] = useState(""); // Username or Email
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [designerTitle, setDesignerTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userVal.trim() || !password.trim()) {
      setErrorMsg("Please fill out all credentials, Bhai.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters, Bhai.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const normalizedInput = userVal.trim();
    const isEmail = normalizedInput.includes("@");
    const usernameId = normalizedInput.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!isEmail && !usernameId) {
      setErrorMsg("Bhai, please enter a valid username.");
      setLoading(false);
      return;
    }

    const activeLocalUsername = isEmail ? normalizedInput.split("@")[0].replace(/[^a-z0-9_]/g, "") : usernameId;

    // 1. Try cloud authentication if online
    if (navigator.onLine) {
      const finalEmail = isEmail ? normalizedInput : `${usernameId}@blueprint.app`;
      try {
        if (isSignUp) {
          const credentials = await createUserWithEmailAndPassword(auth, finalEmail, password);
          const nameToUse = fullName.trim() || normalizedInput;
          const titleToUse = designerTitle.trim() || "Growth Enthusiast • Explorer Level 1";

          const userDocRef = doc(db, "users", credentials.user.uid);
          await setDoc(userDocRef, {
            name: nameToUse,
            title: titleToUse,
            avatarUrl: DEFAULT_PROFILE.avatarUrl,
            remindersEnabled: DEFAULT_PROFILE.remindersEnabled,
            reminderIntervalHours: DEFAULT_PROFILE.reminderIntervalHours,
            email: finalEmail,
            createdAt: new Date().toISOString()
          });

          // Store warm copy offline as well
          const localUserProfile = {
            name: nameToUse,
            title: titleToUse,
            avatarUrl: DEFAULT_PROFILE.avatarUrl,
            remindersEnabled: true,
            reminderIntervalHours: 2
          };
          localStorage.setItem(`mind_blueprint_${activeLocalUsername}_profile`, JSON.stringify(localUserProfile));
          localStorage.setItem(`mind_blueprint_${activeLocalUsername}_config`, JSON.stringify(DEFAULT_CONFIG));
          localStorage.setItem(`mind_blueprint_${activeLocalUsername}_logs`, JSON.stringify([]));
        } else {
          await signInWithEmailAndPassword(auth, finalEmail, password);
        }
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn("Cloud Auth bounced, switching to Local Sandbox fallback:", err);
        
        // Block explicitly for wrong online passwords or duplicate online accounts
        if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
          setErrorMsg("Incorrect Cloud credentials, Bhai.");
          setLoading(false);
          return;
        } else if (err.code === "auth/email-already-in-use") {
          setErrorMsg("Username/Email already registered online. Try logging in, Bhai.");
          setLoading(false);
          return;
        }
        // Fall through to Local Sandbox mode on other errors
      }
    }

    // 2. Local Sandbox Fallback System (Zero lag, offline first)
    const localRegistryRaw = localStorage.getItem("mind_blueprint_local_accounts");
    let localRegistry: Record<string, string> = {};
    if (localRegistryRaw) {
      try {
        localRegistry = JSON.parse(localRegistryRaw);
      } catch (e) {
        console.error(e);
      }
    }

    const userExists = localRegistry[activeLocalUsername] !== undefined;

    if (isSignUp) {
      if (userExists) {
        setErrorMsg("Username already taken offline. Try logging in!");
        setLoading(false);
        return;
      }

      localRegistry[activeLocalUsername] = password.trim();
      localStorage.setItem("mind_blueprint_local_accounts", JSON.stringify(localRegistry));

      const displayNameToUse = fullName.trim() || normalizedInput;
      const bioToUse = designerTitle.trim() || "Growth Enthusiast • Explorer Level 1";
      const localUserProfile = {
        name: displayNameToUse,
        title: bioToUse,
        avatarUrl: DEFAULT_PROFILE.avatarUrl,
        remindersEnabled: true,
        reminderIntervalHours: 2
      };

      localStorage.setItem(`mind_blueprint_${activeLocalUsername}_profile`, JSON.stringify(localUserProfile));
      localStorage.setItem(`mind_blueprint_${activeLocalUsername}_config`, JSON.stringify(DEFAULT_CONFIG));
      localStorage.setItem(`mind_blueprint_${activeLocalUsername}_logs`, JSON.stringify([]));

      localStorage.setItem("mind_blueprint_active_local_username", activeLocalUsername);
      localStorage.setItem("mind_blueprint_guest_mode", "true");
      setLoading(false);
      if (onEnterGuest) onEnterGuest();
    } else {
      if (!userExists) {
        setErrorMsg("Account does not exist! Sign up or use default demo credentials.");
        setLoading(false);
        return;
      }

      const registeredPassword = localRegistry[activeLocalUsername];
      if (registeredPassword !== password.trim()) {
        setErrorMsg("Incorrect local password. Please check credentials, Bhai.");
        setLoading(false);
        return;
      }

      localStorage.setItem("mind_blueprint_active_local_username", activeLocalUsername);
      localStorage.setItem("mind_blueprint_guest_mode", "true");
      setLoading(false);
      if (onEnterGuest) onEnterGuest();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google authentication action bounced: ", err);
      setErrorMsg("Google login was cancelled or is momentarily offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[85vh] p-4 text-center transition-colors duration-200 ${
      darkMode ? "bg-[#0c0c0e] text-white" : "bg-[#f8f9ff] text-[#121c2a]"
    }`}>
      <div className="w-full max-w-[400px] animate-fade-in space-y-4">
        
        {/* Polished login card */}
        <form 
          onSubmit={handleAuthSubmit}
          className={`p-6 border-2 rounded-2xl transition-all space-y-4 text-left shadow-lg ${
            darkMode 
              ? "bg-[#141416] border-zinc-800 text-white" 
              : "bg-white border-slate-200 text-slate-850"
          }`}
          id="auth-credentials-form"
        >
          <div className="border-b pb-3 border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-[#eab308]">
              {isSignUp ? "Create A New Persona" : "Verify Profile Access"}
            </span>
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-slate-400 dark:text-zinc-500">
              <span className={`w-2 h-2 rounded-full ${navigator.onLine ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span>{navigator.onLine ? "Online Sync" : "Local Cache"}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-bold flex gap-2 items-start leading-normal animate-fade-in">
              <LucideIcon name="warning" className="shrink-0 mt-0.5" size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username / Email string entry field */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
              Username or Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                <LucideIcon name="person" size={14} />
              </span>
              <input
                type="text"
                placeholder="Enter email or username (e.g. basant)"
                value={userVal}
                onChange={(e) => setUserVal(e.target.value)}
                required
                className={`w-full border-2 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#eab308] focus:border-transparent transition-all ${
                  darkMode 
                    ? "bg-[#1c1c1e] border-zinc-700 text-white placeholder-zinc-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Expanded customizable details exclusively on true signup option */}
          {isSignUp && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                  Display name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                    <LucideIcon name="badge" size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Basant Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                    className={`w-full border-2 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#eab308] focus:border-transparent transition-all ${
                      darkMode 
                        ? "bg-[#1c1c1e] border-zinc-700 text-white placeholder-zinc-500" 
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                  Persona bio title
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                    <LucideIcon name="interests" size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Designer • Focus Level 5"
                    value={designerTitle}
                    onChange={(e) => setDesignerTitle(e.target.value)}
                    className={`w-full border-2 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#eab308] focus:border-transparent transition-all ${
                      darkMode 
                        ? "bg-[#1c1c1e] border-zinc-700 text-white placeholder-zinc-500" 
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PIN / Password input form */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
              Password PIN
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500">
                <LucideIcon name="lock" size={14} />
              </span>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full border-2 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#eab308] focus:border-transparent transition-all ${
                  darkMode 
                    ? "bg-[#1c1c1e] border-zinc-700 text-white placeholder-zinc-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 uppercase tracking-wider font-sans active:translate-y-0.5"
          >
            {loading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <LucideIcon name="login" size={14} />
            )}
            <span>
              {isSignUp ? "Continue Sign Up" : "Log In Account"}
            </span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-dashed border-slate-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 dark:text-zinc-500 font-mono">OR</span>
            <div className="flex-grow border-t border-dashed border-slate-200 dark:border-zinc-800"></div>
          </div>

          {/* Corrected Google Sign In button classes & colors */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full h-11 font-black text-xs rounded-xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 active:translate-y-0.5 ${
              darkMode 
                ? "bg-zinc-800 border-zinc-750 text-white hover:bg-zinc-700 hover:border-zinc-650" 
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300"
            }`}
          >
            <LucideIcon name="login" className="text-amber-500" size={14} />
            <span>CONTINUE WITH GOOGLE</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-center text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer underline underline-offset-4"
            >
              {isSignUp ? "Already have a profile? Login here!" : "Don't have an account yet? Create one!"}
            </button>
          </div>
        </form>

        <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 text-center">
          ⚡ Flow records are cached securely. Sync is automated on reconnection.
        </p>
      </div>
    </div>
  );
}
