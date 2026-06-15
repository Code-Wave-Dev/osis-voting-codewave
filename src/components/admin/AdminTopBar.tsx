"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, LogOut, Loader2, ChevronDown } from "lucide-react";
import { logoutAdmin } from "@/app/actions/auth";

export function AdminTopBar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
      setIsLoggingOut(true);
      await logoutAdmin();
      // Setelah sesi dihapus di server, arahkan kembali ke gerbang login
      router.push("/admin/login");
    };


  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200 z-50 h-16 px-4 shadow-sm">
      <div className="flex justify-between items-center h-full">
        {/* Logo */}
        <div className="text-xl font-bold text-blue-600 tracking-tight">
          OSIS Portal
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 active:scale-95 transition-all duration-200 p-2 rounded-lg hover:bg-slate-100"
          >
            <UserCircle className="w-6 h-6" strokeWidth={1.5} />
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              {/* Backdrop untuk close saat klik di luar */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown Content */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">Admin</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                   <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5 opacity-70" />
                      )}
                      <span>{isLoggingOut ? "Keluar..." : "Logout"}</span>
                    </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}