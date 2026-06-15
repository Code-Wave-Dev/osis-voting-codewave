"use client";
 
import { UserCircle } from "lucide-react";
 
export function AdminTopBar() {
  return (
    <header className="md:hidden fixed top-0 w-full bg-white/70 backdrop-blur-lg border-b border-white/40 z-50 flex justify-between items-center h-16 px-4 shadow-sm">
      <div className="text-xl font-bold text-blue-600 tracking-tight">
        OSIS Portal
      </div>
      <button className="text-blue-600 active:scale-[0.98] transition-all duration-200 hover:bg-slate-100 p-2 rounded-full">
        <UserCircle className="w-6 h-6" strokeWidth={1.5} />
      </button>
    </header>
  );
}
