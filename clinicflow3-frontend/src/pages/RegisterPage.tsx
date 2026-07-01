import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  const canSubmit = clinicName.trim() && adminName.trim() && email.trim() && password.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await authApi.register(clinicName.trim(), adminName.trim(), email.trim(), password);
      await login(email.trim(), password);
      navigate("/queue", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">ClinicFlow</h1>
          <p className="text-sm text-gray-500 mt-1">by Andrew Cares</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Register your clinic
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Get started in under 2 minutes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Bright Life Clinic"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Dr. Adaeze Okafor"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             disabled:bg-gray-50 disabled:text-gray-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200
                            rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-medium py-2.5 rounded-lg text-sm
                         transition-colors duration-150"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ClinicFlow v1.0 — Built with purpose. Channeled from pain.
        </p>
      </div>
    </div>
  );
}