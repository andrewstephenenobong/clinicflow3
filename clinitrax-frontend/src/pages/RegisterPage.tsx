import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Lock, Mail, ShieldCheck, Clock, User, Building } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [clinicName, setClinicName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation touches
  const [clinicTouched, setClinicTouched] = useState(false);
  const [adminTouched, setAdminTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Field validation messages
  const clinicError = clinicTouched && !clinicName.trim() ? "Clinic name is required" : "";
  const adminError = adminTouched && !adminName.trim() ? "Your name is required" : "";
  const emailError = emailTouched && !email.trim() ? "Email is required" 
    : emailTouched && !/\S+@\S+\.\S+/.test(email) ? "Please enter a valid email address"
    : "";
  const passwordError = passwordTouched && !password ? "Password is required"
    : passwordTouched && password.length < 6 ? "Password must be at least 6 characters"
    : "";

  const canSubmit = clinicName.trim() && adminName.trim() && email.trim() && password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClinicTouched(true);
    setAdminTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setError("");

    if (!canSubmit || clinicError || adminError || emailError || passwordError) {
      setError("Please fill out all fields correctly before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register(clinicName.trim(), adminName.trim(), email.trim(), password);
      await login(email.trim(), password);
      navigate("/queue", { replace: true });
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "";
      if (rawMsg.toLowerCase().includes("already exists") || rawMsg.toLowerCase().includes("conflict")) {
        setError("An account with this email address is already registered. Please sign in or use another email.");
      } else {
        setError(rawMsg || "Registration failed. Please verify your details and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* Left side panel - Visual/Brand context (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 flex-col justify-between p-12 text-white overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-3xl" />
        
        {/* Brand header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-md border border-white/20">
            <img src="/brand/logo-mark-white.png" alt="" className="h-8 w-8" />
          </div>
          <span className="text-xl font-bold tracking-tight">CliniTrax</span>
        </div>

        {/* Hero message / info */}
        <div className="my-auto space-y-8 z-10 max-w-md">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Get started with CliniTrax in minutes.
            </h1>
            <p className="text-blue-100 text-base leading-relaxed">
              Create an administrative account for your clinic, add your ward configuration, and invite your clinical staff immediately.
            </p>
          </div>

          {/* Value cards */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-white">Full HIPAA Compliance</h4>
                <p className="text-xs text-blue-200">Patient data encrypted in transit and at rest with strict audit logs.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
              <Clock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-white">Instant Deployment</h4>
                <p className="text-xs text-blue-200">Set up wards, beds, and triage queues without complex IT installations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer badges */}
        <div className="flex items-center space-x-6 z-10 text-xs text-blue-200">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Secure HIPAA-ready
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-emerald-400" />
            99.9% System Uptime
          </span>
        </div>
      </div>

      {/* Right side panel - Registration Form */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 md:p-20 bg-slate-50 w-full min-h-screen">
        {/* Mobile Header (Hidden on large screens) */}
        <div className="flex items-center justify-center lg:hidden mb-8">
          <div className="flex items-center space-x-2.5">
            <img src="/brand/logo-mark.png" alt="" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-slate-900">CliniTrax</span>
          </div>
        </div>

        {/* Center alignment spacer */}
        <div className="my-auto max-w-md w-full mx-auto space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Register your clinic
            </h2>
            <p className="text-slate-500 text-sm">
              Create an administrator account to initialize your facility.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
            {error && (
              <div className="flex gap-3 bg-red-50/80 border border-red-200 rounded-xl p-4 text-sm text-red-800 animate-slide-in">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-semibold text-red-950">Registration Issue</h5>
                  <p className="text-red-800/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Clinic Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Clinic name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    onBlur={() => setClinicTouched(true)}
                    placeholder="e.g. Bright Life Clinic"
                    disabled={isSubmitting}
                    aria-invalid={!!clinicError}
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm transition-all outline-none
                      ${clinicError 
                        ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                        : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      }
                      disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
                  />
                </div>
                {clinicError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-slide-in">
                    <AlertCircle className="h-3 w-3" />
                    {clinicError}
                  </p>
                )}
              </div>

              {/* Admin Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Your name (Administrator)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    onBlur={() => setAdminTouched(true)}
                    placeholder="e.g. Dr. Adaeze Okafor"
                    disabled={isSubmitting}
                    aria-invalid={!!adminError}
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm transition-all outline-none
                      ${adminError 
                        ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                        : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      }
                      disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
                  />
                </div>
                {adminError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-slide-in">
                    <AlertCircle className="h-3 w-3" />
                    {adminError}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="you@clinic.com"
                    disabled={isSubmitting}
                    aria-invalid={!!emailError}
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm transition-all outline-none
                      ${emailError 
                        ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                        : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      }
                      disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-slide-in">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="•••••••• (Min 6 chars)"
                    disabled={isSubmitting}
                    aria-invalid={!!passwordError}
                    className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm transition-all outline-none
                      ${passwordError 
                        ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                        : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      }
                      disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-slide-in">
                    <AlertCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm
                           shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2
                           disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  "Create Administrator Account"
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Already registered?</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4">
                Sign in to your existing account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 font-medium">
            CliniTrax v1.0 — Dedicated to healthcare efficiency and patient flow.
          </p>
        </div>
      </div>
    </div>
  );
}