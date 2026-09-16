"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import TrainerDashboardClient from "@/components/TrainerDashboardClient";

export default function TrainerDashboardPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();

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

  const styles = {
    light: {
      bg: "bg-slate-50",
      card: "bg-white border-slate-200",
      cardHover: "hover:shadow-md hover:border-blue-200",
    },
    dark: {
      bg: "bg-slate-900",
      card: "bg-slate-800/50 border-slate-700",
      cardHover: "hover:shadow-xl hover:shadow-blue-500/10 hover:border-slate-600",
    }
  };

  const currentStyles = styles[theme];

  return (
    <main className={`relative ${currentStyles.bg} min-h-screen transition-colors duration-300`}>
      {/* Simple Clean Background - No complex overlays */}
      <div className="fixed inset-0 -z-10">
        {theme === 'dark' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/30" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50/30" />
        )}
      </div>

      {/* Theme Toggle Button - Smaller, Bottom Right */}
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-50 p-2 rounded-full ${currentStyles.card} border shadow-lg transition-all ${currentStyles.cardHover}`}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4 text-slate-700" />
        ) : (
          <Sun className="w-4 h-4 text-yellow-400" />
        )}
      </button>

      <div className="relative z-10 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <TrainerDashboardClient />
        </div>
      </div>
    </main>
  );
}
