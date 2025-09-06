// src/Login/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
// If you're using Vite's /public folder, you can also use: const BackgroundImg = "/login.jpg";
import BackgroundImg from "../../public/login.jpg";

export default function Login() {
  const navigate = useNavigate();
  const { login, getRedirectPath, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { role } = await login({ email, password });
      toast.success("Logged in successfully 🎉");
      navigate(getRedirectPath(role), { replace: true });
    } catch (e) {
      const message = e.message || "Login failed";
      setErr(message);
      toast.error(message);
    }
  };

  const bg = BackgroundImg || "/login.jpg"; // fallback if needed

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat font-Outfit"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white/85 backdrop-blur-xl shadow-xl">
            {/* Header */}
            <div className="px-8 pt-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                <Shield size={20} />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-600">Sign in to your account.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-1000">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-1000">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 pr-11 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error banner (still useful alongside toast) */}
              {err ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {err}
                </div>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-black disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <p className="text-center text-xs text-gray-500">
              Create a new account <Link to="/register"><span className="text-gray-600 cursor-pointer">Register</span></Link>
              </p>
              <p className="text-center text-xs text-gray-500">
                By continuing you agree to our Terms & Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
