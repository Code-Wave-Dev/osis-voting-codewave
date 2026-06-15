"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { markTokenAsUsed } from "@/app/actions/auth";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    markTokenAsUsed();
  }, []);

  const handleExit = () => {
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      <div className="absolute top-0 left-0 w-125 h-125 bg-blue-100/40 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-150 h-150 bg-blue-50/60 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg border border-white/40 shadow-xl shadow-blue-500/10 rounded-3xl p-8 text-center relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
          <CheckCircle className="w-12 h-12 relative z-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Terima Kasih!
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Suara Anda telah berhasil dicatat secara rahasia dan aman di dalam
          sistem.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-slate-600">
            Asas LUBER JURDIL Terlindungi
          </span>
        </div>

        <button
          onClick={handleExit}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl active:scale-[0.98] transition-all duration-200 shadow-md shadow-blue-500/20"
        >
          Kembali ke Layar Utama
        </button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <p className="text-xs text-slate-400 font-medium">
          &copy; 2026 KPU OSIS SMK Budi Bakti Ciwidey
        </p>
      </div>
    </main>
  );
}