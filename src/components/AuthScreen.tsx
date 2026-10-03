import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { KeyRound, Mail, Sparkles, User, Info, Terminal, AlertCircle, Chrome, ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onGuestAccess?: () => void;
}

export default function AuthScreen({ onAuthSuccess, onGuestAccess }: AuthScreenProps) {
  // Mode: "signin" | "signup" | "reset"
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("AI Workspace Operator");
  const [avatar, setAvatar] = useState("🧠");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [resetSuccessText, setResetSuccessText] = useState("");

  const emojis = ["🧠", "🧙", "🦀", "⚡", "🛸", "🤖", "💼", "🌸", "🎯", "⚖️"];

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setResetSuccessText("");

    // Handle Password Reset Mode
    if (authMode === "reset") {
      if (!email.trim()) {
        setErrorText("Please provide your registered operational email address.");
        return;
      }
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSuccessText(`Password recovery dispatch sent to ${email.trim()}. Please check your inbox and follow instructions to reset your access phrase.`);
      } catch (err: any) {
        console.error("Password reset failure:", err);
        let errMsg = err.message;
        if (err.code === "auth/user-not-found") {
          errMsg = "No registered operator record located matching this email.";
        } else if (err.code === "auth/invalid-email") {
          errMsg = "Invalid email format. Please check the entered address.";
        }
        setErrorText(errMsg);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Handle Sign Up Validation
    if (authMode === "signup") {
      if (!name.trim()) {
        setErrorText("Display Name is required.");
        return;
      }
      if (password.length < 6) {
        setErrorText("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorText("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === "signup") {
        // Create User Auth in Firebase
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Create User Profile Entry in Firestore conforming strictly to firestore.rules
        const userProfileRef = doc(db, "users", user.uid);
        try {
          await setDoc(userProfileRef, {
            userId: user.uid,
            name: name.trim(),
            email: email.trim(),
            role: role.trim(),
            avatar: avatar,
            trustedOperator: email.trim().toLowerCase() === "gxqstudio@gmail.com", // Granted special admin clearance matching rules
            customGreeting: "Access Granted. Initializing Nexus Command Channels...",
            tutorialCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
        }

      } else {
        // Standard Log In
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      onAuthSuccess();
    } catch (err: any) {
      console.error("Authentication Exception Error:", err);
      let errMsg = err.message;
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use by another operator.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errMsg = "Invalid email or credentials clearance passphrase.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "The security passphrase is too weak (min 6 characters required).";
      } else if (err.code === "auth/user-not-found") {
        errMsg = "No authorized clearance profile resolved for this email.";
      } else if (err.message.includes("configuration")) {
        errMsg = "Firebase requires Email & Password provider to be toggled ON in the Console first.";
      }
      setErrorText(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorText("");
    setResetSuccessText("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userProfileRef = doc(db, "users", user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(userProfileRef);
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.GET, `users/${user.uid}`);
      }

      if (docSnap && !docSnap.exists()) {
        try {
          await setDoc(userProfileRef, {
            userId: user.uid,
            name: user.displayName || "Google Operator",
            email: user.email || "",
            role: "AI Workspace Operator",
            avatar: "🧠",
            trustedOperator: user.email?.toLowerCase() === "gxqstudio@gmail.com",
            customGreeting: "Access Granted. Initializing Nexus Google Channels...",
            tutorialCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error("Google authentication exception:", err);
      let errMsg = err.message;
      if (err.code === "auth/popup-blocked") {
        errMsg = "Google sign-in popup was blocked. Please enable popups or try again.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Google sign-in popup was closed before completion.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Google login provider is not enabled in administrative Firebase Console settings.";
      }
      setErrorText(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none" id="nexus-auth-backdrop">
      {/* Background Orbits & Neon Cyber Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden p-8 backdrop-blur-xl relative z-10 shadow-2xl"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3 text-[10px] font-mono font-semibold text-indigo-300">
            <Terminal className="w-3.5 h-3.5" />
            <span>NEXUS OPERATIONAL SECURITY</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            {authMode === "signup"
              ? "Forge Operator Clearance"
              : authMode === "reset"
              ? "Reset Access Passphrase"
              : "Operator Clearance Desk"}
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-sans">
            {authMode === "signup"
              ? "Establish your local credentials to sync workspace automation files."
              : authMode === "reset"
              ? "Transmit recovery signals to configure a new access credential."
              : "Authorize terminal connection with secure cryptographic parameters."}
          </p>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {errorText && (
            <motion.div
              className="bg-red-500/15 border border-red-500/30 p-4 rounded-2xl mb-6 text-left"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              id="auth-error-terminal"
            >
              <div className="flex gap-2.5 items-start font-mono text-[11px] text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] mb-0.5">Authorization Denied</div>
                  <div>{errorText}</div>
                </div>
              </div>
            </motion.div>
          )}

          {resetSuccessText && (
            <motion.div
              className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl mb-6 text-left"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              id="auth-success-terminal"
            >
              <div className="flex gap-2.5 items-start font-mono text-[11px] text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] mb-0.5">Signal Dispatched</div>
                  <div>{resetSuccessText}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAction} className="space-y-4">
          {authMode === "signup" && (
            <>
              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-slate-500 block">OPERATOR DISPLAY NAME</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ada Lovelace"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans"
                    required
                  />
                </div>
              </div>

              {/* Persona role */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-slate-500 block">AESTHETIC OPERATIONAL CLASS</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. System Architect"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans"
                />
              </div>

              {/* Avatar Picker */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-slate-500 block">SYSTEM LOGO AVATAR</label>
                <div className="flex gap-1.5 flex-wrap">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`text-lg p-1.5 rounded-lg border cursor-pointer transition ${
                        avatar === emoji
                          ? "border-indigo-500 bg-indigo-950/40"
                          : "border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-mono text-slate-500 block">SECURE EMAIL CHANNELS</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans"
                required
              />
            </div>
          </div>

          {/* Password (for signin and signup) */}
          {authMode !== "reset" && (
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-slate-500 block">CRYPTOGRAPHIC LOG-PASSPHRASE</label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("reset");
                      setErrorText("");
                      setResetSuccessText("");
                    }}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot Passphrase?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans"
                  required
                />
              </div>
            </div>
          )}

          {authMode === "signup" && (
            /* Confirm Password */
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono text-slate-500 block">CONFIRM SECURE PASSPHRASE</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 font-sans"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-sans text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/15 cursor-pointer flex justify-center items-center gap-1.5 transition disabled:opacity-50"
            id="auth-submit-btn"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {authMode === "signup"
                    ? "INITIALIZE OPERATOR PROFILE"
                    : authMode === "reset"
                    ? "TRANSMIT RECOVERY DISPATCH"
                    : "AUTHORIZE ENTRANCE"}
                </span>
                {authMode === "reset" ? <RotateCcw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </>
            )}
          </button>
        </form>

        {/* In reset mode, show back button */}
        {authMode === "reset" ? (
          <div className="mt-6 text-center text-xs">
            <button
              onClick={() => {
                setAuthMode("signin");
                setErrorText("");
                setResetSuccessText("");
              }}
              className="text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto font-mono text-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Operator Clearance Desk</span>
            </button>
          </div>
        ) : (
          <>
            {/* OR dividing rule */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-800/80" />
              <span className="relative bg-slate-900 px-3.5 text-[9px] font-mono text-slate-500 uppercase tracking-wider">OR CRYPTO IDENTITY</span>
            </div>

            {/* Google Clearances Authentication */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-sans text-xs font-bold rounded-xl flex justify-center items-center gap-2 cursor-pointer transition disabled:opacity-50"
              id="google-signin-btn"
            >
              <Chrome className="w-4 h-4 text-indigo-600" />
              <span>CONTINUE WITH GOOGLE SECURE</span>
            </button>

            {/* Instant Live Guest Operator Entrance */}
            {onGuestAccess && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onGuestAccess}
                  className="w-full py-2.5 bg-slate-950/80 hover:bg-slate-900 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400/50 font-mono text-xs font-semibold rounded-xl flex justify-center items-center gap-2 cursor-pointer transition shadow-md shadow-cyan-500/10"
                  id="guest-access-btn"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ENTER AS GUEST OPERATOR (LIVE ACCESS)</span>
                </button>
              </div>
            )}

            {/* Toggle option */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {authMode === "signup" ? "Already a cleared operator?" : "First time executing Nexus?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(authMode === "signup" ? "signin" : "signup");
                  setErrorText("");
                  setResetSuccessText("");
                }}
                className="text-cyan-400 font-semibold hover:underline cursor-pointer bg-transparent border-none outline-none inline-block pl-0.5"
                id="auth-toggle-btn"
              >
                {authMode === "signup" ? "Sign In instead" : "Provision New Operator"}
              </button>
            </div>
          </>
        )}

        {/* User setup reminder block */}
        <div className="mt-8 border-t border-slate-800/60 pt-4 flex gap-2.5 items-start text-slate-400 text-[10px] text-left leading-normal font-sans">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="font-mono">
            <strong>ADMIN NOTICE:</strong> Ensure you have toggled <strong>"Email/Password"</strong> Auth ON inside your Firebase project settings to allow workspace credential forging.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
