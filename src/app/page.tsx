"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { GraduationCap, CircleHelp, Loader2, AlertCircle } from "lucide-react";
import { verifyVoterPin } from "@/app/actions/auth";
 
export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
 
    setIsLoading(false);
    setErrorMessage(null);
    setIsLoading(true);
 
    const result = await verifyVoterPin(pin);
 
    if (!result.success) {
      setErrorMessage(result.error || "Gagal masuk.");
      setIsLoading(false);
      setPin("");
    } else {
      router.push("/vote");
    }
  };
 
  return (
    <main className="bg-slate-50 min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Perbaikan Kelas Tailwind di sini */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="absolute w-125 h-125 bg-blue-600/5 rounded-full blur-3xl -top-25 -left-25"></div>
        <div className="absolute w-100 h-100 bg-blue-600/10 rounded-full blur-3xl -bottom-12.5 -right-12.5"></div>
      </div>
 
      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-xl p-8 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <GraduationCap
              className="text-blue-600 w-8 h-8"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
 
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">
            Masuk ke Portal Suara
          </h1>
          {/* Perbaikan max-w-[280px] menjadi max-w-70 */}
          <p className="text-sm text-slate-500 mb-8 text-center max-w-70 leading-relaxed">
            Masukkan 6 digit kode OTP yang telah diberikan oleh panitia
            pemilihan.
          </p>
 
          <form
            id="login-form"
            onSubmit={handleLogin}
            className="w-full flex flex-col items-center gap-6"
          >
            <div
              className="flex justify-center w-full"
              aria-label="Grup Input OTP"
            >
              <label htmlFor="otp-input" className="sr-only">
                Masukkan 6 digit PIN OTP
              </label>
 
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={(value) => setPin(value)}
                disabled={isLoading}
                id="otp-input"
                name="otp-input"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={0}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                </InputOTPGroup>
 
                <InputOTPSeparator className="text-slate-400 font-bold mx-1" />
 
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={3}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                  <InputOTPSlot
                    index={4}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                  <InputOTPSlot
                    index={5}
                    className="w-12 h-14 text-xl font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
 
            {errorMessage && (
              <div className="w-full bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-red-600 text-xs animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-normal">{errorMessage}</span>
              </div>
            )}
 
            <button
              type="submit"
              disabled={pin.length !== 6 || isLoading}
              className="w-full py-4 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="mr-2 h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Memvalidasi...</span>
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
 
          <div className="mt-8 flex items-center justify-center gap-2 text-center w-full">
            <CircleHelp className="text-slate-500 w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-medium text-slate-500">
              Butuh bantuan? Hubungi panitia.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
