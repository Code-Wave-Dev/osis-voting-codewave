"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { loginAdmin } from "@/app/actions/auth";
 
export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
 
  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
 
    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);
 
    if (!result.success) {
      setErrorMessage(result.error || "Gagal masuk.");
      setIsLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-0 selection:bg-blue-100 selection:text-blue-900">
      {/* PERBAIKAN: Penulisan nilai arbitrer negatif Tailwind CSS */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 w-screen h-screen -z-10 overflow-hidden bg-slate-50"
      >
        <div className="absolute w-[60vh] h-[60vh] bg-[radial-gradient(circle,var(--tw-colors-blue-100)_0%,rgba(255,255,255,0)_70%)] rounded-full top-[-10vh] right-[-10vw] opacity-50"></div>
        <div className="absolute w-[50vh] h-[50vh] bg-[radial-gradient(circle,var(--tw-colors-blue-200)_0%,rgba(255,255,255,0)_70%)] rounded-full bottom-[-5vh] left-[-15vw] opacity-30"></div>
      </div>
 
      <main className="w-full max-w-md mx-auto flex flex-col gap-8 relative z-10">
        <header className="flex flex-col items-center justify-center gap-4 text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5"></div>
            <ShieldCheck className="w-8 h-8 relative z-10" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
              OSIS Portal
            </h1>
            <p className="text-sm text-slate-500">
              Secure Administrator Access
            </p>
          </div>
        </header>
 
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-[20px] p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <form
            onSubmit={handleAdminLogin}
            className="flex flex-col gap-5 relative z-10"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="text-xs font-medium text-slate-500 flex justify-between"
              >
                <span>Staff ID or Email</span>
                <User
                  className="w-3.5 h-3.5 text-slate-400"
                  aria-hidden="true"
                />
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@institution.edu"
                  required
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all duration-200 shadow-sm disabled:opacity-60"
                />
              </div>
            </div>
 
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-500 flex justify-between"
              >
                <span>Password</span>
                <Lock
                  className="w-3.5 h-3.5 text-slate-400"
                  aria-hidden="true"
                />
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-12 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none transition-all duration-200 shadow-sm disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors h-6 w-6 flex items-center justify-center focus:outline-none"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
 
            {errorMessage && (
              <div className="w-full bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-red-600 text-xs animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-normal">{errorMessage}</span>
              </div>
            )}
 
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 mt-2 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] hover:bg-blue-700 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
 
          <div className="mt-2 text-center border-t border-slate-200/50 pt-4">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Authorized personnel only. Access is logged.
            </p>
          </div>
        </div>
 
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-6 h-12 rounded-xl border-2 border-blue-600/20 text-blue-600 text-sm font-medium hover:bg-blue-600/5 hover:border-blue-600/40 active:scale-[0.98] transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Return to Student Portal</span>
          </button>
        </div>
      </main>
    </div>
  );
}
