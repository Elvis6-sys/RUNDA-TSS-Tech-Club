"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, LogIn, Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
  }, []);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token in localStorage for browser-side access
      localStorage.setItem('auth-token', data.token);

      // Log success
      console.log('✅ Login successful, redirecting to dashboard...');

      // Use Next.js router for navigation
      router.push("/dashboard");

      // Fallback to window.location after a delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  // Theme-based styles
  const styles = {
    light: {
      bg: "bg-gradient-to-br from-slate-50 via-white to-blue-50",
      card: "bg-white border-slate-200",
      text: "text-slate-900",
      subText: "text-slate-600",
      label: "text-slate-700",
      input: "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      statsBg: "bg-blue-50 border-blue-100",
      statsText: "text-blue-900",
      statsSubText: "text-blue-700",
      themeButton: "bg-white border-slate-200 text-slate-700",
    },
    dark: {
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      card: "bg-slate-800 border-slate-700",
      text: "text-white",
      subText: "text-slate-300",
      label: "text-slate-300",
      input: "bg-slate-900 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      statsBg: "bg-blue-500/10 border-blue-500/20",
      statsText: "text-blue-300",
      statsSubText: "text-blue-400",
      themeButton: "bg-slate-700 border-slate-600 text-slate-200",
    }
  };

  const currentStyles = styles[theme];

  const inputClass = `w-full rounded-lg border ${currentStyles.input} px-4 py-2.5 text-sm outline-none transition focus:ring-2 placeholder:text-slate-400`;

  const studentImages = [
    "/images/login-student-1.jpg",
    "/images/login-student-2.jpg",
    "/images/login-student-3.jpg"
  ];

  return (
    <main className={`min-h-screen ${currentStyles.bg} flex items-center justify-center p-4 transition-colors duration-300`}>
      {/* Subtle background pattern */}
      <div className={`fixed inset-0 bg-[linear-gradient(to_right,${theme === 'light' ? '#e2e8f0' : '#475569'}_1px,transparent_1px),linear-gradient(to_bottom,${theme === 'light' ? '#e2e8f0' : '#475569'}_1px,transparent_1px)] bg-[size:3rem_3rem] ${theme === 'light' ? 'opacity-30' : 'opacity-10'}`} />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full ${currentStyles.themeButton} border shadow-lg transition-all hover:scale-105`}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </button>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start lg:items-center">

          {/* Left Side - Image Showcase */}
          <div className="flex flex-row lg:flex-col items-center justify-center lg:justify-start space-x-4 lg:space-x-0 lg:space-y-4 mb-6 lg:mb-0">
            <div className="text-center space-y-2 lg:space-y-3 hidden lg:block">
              <h2 className={`text-xl lg:text-2xl font-bold ${currentStyles.text}`}>Welcome Back!</h2>
              <p className={`text-xs lg:text-sm ${currentStyles.subText}`}>Sign in to continue your journey</p>
            </div>

            {/* Circular Images - Horizontal on mobile, vertical on desktop */}
            <div className="flex flex-row lg:flex-col items-center lg:space-y-2 relative z-0">
              {studentImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 lg:border-4 ${theme === 'light' ? 'border-white' : 'border-slate-700'} shadow-lg hover:scale-105 transition-transform ${idx > 0 ? '-ml-3 lg:ml-0 lg:-mt-3' : ''}`}
                  style={{
                    zIndex: idx === 0 ? 3 : idx === 1 ? 2 : 1,
                    position: 'relative'
                  }}
                >
                  <Image
                    src={img}
                    alt={`Student ${idx + 1}`}
                    fill
                    className="object-cover"
                    style={{ zIndex: -1 }}
                  />
                </div>
              ))}
            </div>

            <div className={`${currentStyles.statsBg} border rounded-lg lg:rounded-xl p-3 lg:p-4 text-center space-y-1 lg:space-y-2 hidden lg:block`}>
              <p className={`text-xs lg:text-sm font-medium ${currentStyles.statsText}`}>500+ Active Members</p>
              <p className={`text-xs ${currentStyles.statsSubText}`}>Join the community today</p>
            </div>
          </div>

          {/* Right Side - Compact Login Form */}
          <div className={`${currentStyles.card} rounded-xl lg:rounded-2xl border shadow-xl p-6 sm:p-8 lg:p-10 transition-colors duration-300 max-w-md lg:max-w-lg mx-auto w-full`}>

            <div className="text-center mb-6 lg:mb-8">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-500/10'} flex items-center justify-center mx-auto mb-3 lg:mb-4`}>
                <LogIn className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold ${currentStyles.text}`}>Member Login</h1>
              <p className={`text-xs sm:text-sm ${currentStyles.subText} mt-2`}>Access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                  <Mail className="w-3 h-3 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="john@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                  <Lock className="w-3 h-3 inline mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg ${currentStyles.button} px-4 py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className={`absolute inset-0 flex items-center`}>
                  <div className={`w-full border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700'}`}></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`${theme === 'light' ? 'bg-white' : 'bg-slate-800'} px-2 ${currentStyles.subText}`}>
                    New to the platform?
                  </span>
                </div>
              </div>

              <a
                href="/auth/register"
                className={`block w-full text-center rounded-lg border-2 ${theme === 'light' ? 'border-slate-300 hover:border-blue-300 hover:bg-slate-50' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-700'} px-4 py-3 text-sm font-semibold ${currentStyles.text} transition`}
              >
                Create an Account
              </a>
            </form>

            <p className={`text-center text-xs ${currentStyles.subText} mt-6`}>
              By signing in, you agree to our{" "}
              <a href="/terms" className={`${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'} font-medium`}>
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
