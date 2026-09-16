"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Mail, Lock, School, Calendar, FileText, Link as LinkIcon, CheckCircle, Moon, Sun, GraduationCap } from "lucide-react";
import { DEPARTMENTS } from "@/lib/departments";

const defaultRubric = {
  academicPerformance: "",
  technicalTask: "",
  statement: ""
};

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [cohort, setCohort] = useState("");
  const [department, setDepartment] = useState(""); // Department selection
  const [level, setLevel] = useState(""); // NEW: RQF Level selection (l3, l4, l5)
  const [isAlumni, setIsAlumni] = useState(false);
  const [graduationYear, setGraduationYear] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [rubric, setRubric] = useState(defaultRubric);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          school,
          cohort,
          department,
          level, // NEW: RQF Level
          graduationYear: isAlumni && graduationYear ? graduationYear : null,
          taskLink: taskLink || null,
          portfolioLink: portfolioLink || null,
          rubric
        })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      setSuccess(
        "Application submitted successfully! You will now need to complete an entrance test before your account is reviewed."
      );

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Unable to complete registration. Please try again.");
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
      sectionBg: "bg-slate-50 border-slate-200",
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
      sectionBg: "bg-slate-900/50 border-slate-700",
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
    "/images/student-1.jpg",
    "/images/student-2.jpg",
    "/images/student-3.jpg"
  ];

  return (
    <main className={`min-h-screen ${currentStyles.bg} flex items-center justify-center p-4 py-12 transition-colors duration-300`}>
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
        <div className="grid md:grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">

          {/* Left Side - Image Showcase */}
          <div className="flex flex-row lg:flex-col items-center justify-center lg:justify-start space-x-4 lg:space-x-0 lg:space-y-4 mb-6 lg:mb-0 lg:sticky lg:top-8">
            <div className="text-center space-y-2 lg:space-y-3 hidden lg:block">
              <h2 className={`text-xl lg:text-2xl font-bold ${currentStyles.text}`}>Join Our Community</h2>
              <p className={`text-xs lg:text-sm ${currentStyles.subText}`}>Be part of Rwanda&apos;s TVET excellence</p>
            </div>

            {/* Circular Images - Horizontal on mobile, vertical on desktop */}
            <div className="flex flex-row lg:flex-col items-center lg:space-y-2">
              {studentImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 lg:border-4 ${theme === 'light' ? 'border-white' : 'border-slate-700'} shadow-lg hover:scale-105 transition-transform ${idx > 0 ? '-ml-3 lg:ml-0 lg:-mt-3' : ''}`}
                  style={{
                    zIndex: studentImages.length - idx
                  }}
                >
                  <Image
                    src={img}
                    alt={`Student ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <div className={`${currentStyles.statsBg} border rounded-lg lg:rounded-xl p-3 lg:p-4 text-center space-y-1 lg:space-y-2 hidden lg:block`}>
              <p className={`text-xs lg:text-sm font-medium ${currentStyles.statsText}`}>500+ Students</p>
              <p className={`text-xs ${currentStyles.statsSubText}`}>Learning together across Rwanda</p>
            </div>
          </div>

          {/* Right Side - Compact Registration Form */}
          <div className={`${currentStyles.card} rounded-xl lg:rounded-2xl border shadow-xl p-6 sm:p-8 lg:p-10 transition-colors duration-300`}>

            {success ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className={`text-2xl font-bold ${currentStyles.text}`}>Registration Complete!</h2>
                  <p className={currentStyles.subText}>{success}</p>
                  <div className={`${currentStyles.statsBg} border rounded-lg p-4 mt-4`}>
                    <p className={`text-sm font-semibold ${currentStyles.statsText} mb-2`}>
                      📝 Next Steps:
                    </p>
                    <ol className={`text-xs ${currentStyles.statsSubText} text-left space-y-1 list-decimal list-inside`}>
                      <li>Login with your credentials</li>
                      <li>Complete the entrance test</li>
                      <li>Wait for teacher review & approval</li>
                      <li>Start learning!</li>
                    </ol>
                  </div>
                </div>
                <a
                  href="/auth/login"
                  className={`block w-full text-center rounded-lg ${currentStyles.button} px-4 py-3 text-sm font-semibold transition shadow-md`}
                >
                  Go to Login →
                </a>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className={`text-2xl font-bold ${currentStyles.text}`}>Create Your Account</h1>
                  <p className={`text-sm ${currentStyles.subText} mt-1`}>Fill in your details to apply</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Personal Info - Compact Grid */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <User className="w-3 h-3 inline mr-1" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder="John Doe"
                      />
                    </div>
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
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Min. 8 characters"
                    />
                  </div>

                  {/* School Info */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <School className="w-3 h-3 inline mr-1" />
                        School / Institution
                      </label>
                      <input
                        type="text"
                        required
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className={inputClass}
                        placeholder="RUNDA TSS"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Cohort / Year
                      </label>
                      <input
                        type="text"
                        required
                        value={cohort}
                        onChange={(e) => setCohort(e.target.value)}
                        className={inputClass}
                        placeholder="2024"
                      />
                    </div>
                  </div>

                  {/* Department & Level Selection */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <GraduationCap className="w-3 h-3 inline mr-1" />
                        Department / Trade
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select your trade...</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.icon} {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <School className="w-3 h-3 inline mr-1" />
                        RQF Level
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        required
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select level...</option>
                        <option value="l3">Level 3 (Foundation)</option>
                        <option value="l4">Level 4 (Intermediate)</option>
                        <option value="l5">Level 5 (Advanced)</option>
                      </select>
                    </div>
                  </div>

                  {department && level && (
                    <div className={`${currentStyles.statsBg} border rounded-lg p-3`}>
                      <p className={`text-xs ${currentStyles.statsText} font-medium`}>
                        📝 After registration, you&apos;ll take an entrance test for:
                      </p>
                      <p className={`text-xs ${currentStyles.statsSubText} mt-1`}>
                        {DEPARTMENTS.find(d => d.id === department)?.name} - {level.toUpperCase().replace('L', 'Level ')}
                      </p>
                    </div>
                  )}

                  {/* Alumni Toggle */}
                  <label className={`flex items-center gap-2 text-sm ${currentStyles.label} cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={isAlumni}
                      onChange={(e) => setIsAlumni(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    I am applying as an alumni
                  </label>

                  {isAlumni && (
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>Graduation Year</label>
                      <input
                        type="number"
                        required={isAlumni}
                        min={2000}
                        max={new Date().getFullYear()}
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className={inputClass}
                        placeholder="2023"
                      />
                    </div>
                  )}

                  {/* Application Details - Compact */}
                  <div className={`${currentStyles.sectionBg} border rounded-lg p-4 space-y-3`}>
                    <p className={`text-xs font-semibold ${currentStyles.label} uppercase tracking-wider`}>Application Details</p>

                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <FileText className="w-3 h-3 inline mr-1" />
                        Academic Performance
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={rubric.academicPerformance}
                        onChange={(e) => setRubric({ ...rubric, academicPerformance: e.target.value })}
                        className={inputClass}
                        placeholder="Brief summary of your performance..."
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>Technical Project</label>
                      <textarea
                        required
                        rows={2}
                        value={rubric.technicalTask}
                        onChange={(e) => setRubric({ ...rubric, technicalTask: e.target.value })}
                        className={inputClass}
                        placeholder="Describe a project you've completed..."
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>Why Join?</label>
                      <textarea
                        required
                        rows={2}
                        value={rubric.statement}
                        onChange={(e) => setRubric({ ...rubric, statement: e.target.value })}
                        className={inputClass}
                        placeholder="What motivates you to join..."
                      />
                    </div>
                  </div>

                  {/* Optional Links */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        <LinkIcon className="w-3 h-3 inline mr-1" />
                        Project Link <span className="text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={taskLink}
                        onChange={(e) => setTaskLink(e.target.value)}
                        className={inputClass}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${currentStyles.label} mb-1.5`}>
                        Portfolio Link <span className="text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={portfolioLink}
                        onChange={(e) => setPortfolioLink(e.target.value)}
                        className={inputClass}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-lg ${currentStyles.button} px-4 py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>

                  <p className={`text-center text-sm ${currentStyles.subText}`}>
                    Already have an account?{" "}
                    <a href="/auth/login" className={`${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'} font-medium`}>
                      Sign in
                    </a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
