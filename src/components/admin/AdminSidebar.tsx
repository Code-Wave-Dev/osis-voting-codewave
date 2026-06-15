"use client";
 
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  // BarChart3,
  Users,
  LogOut,
  Vote,
  Loader2,
  Megaphone, // Tambahkan import ikon ini
} from "lucide-react";
import { logoutAdmin } from "@/app/actions/auth";
 
export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
 
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAdmin();
    // Setelah sesi dihapus di server, arahkan kembali ke gerbang login
    router.push("/admin/login");
  };
 
  const navItems = [
    {
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    // { name: "Statistik", href: "/admin/statistik", icon: BarChart3 },
    { name: "Data Paslon", href: "/admin/kandidat", icon: Megaphone }, // Menu Baru
    { name: "Daftar Pemilih", href: "/admin/pemilih", icon: Vote },
    { name: "Data Kelas", href: "/admin/kelas", icon: Users },
  ];
 
  return (
    <aside className="hidden md:flex flex-col w-64 fixed h-full bg-white border-r border-slate-200 z-40 py-6 px-4 shadow-[4px_0_24px_rgb(0,0,0,0.02)]">
      <div className="flex items-center gap-3 px-4 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          OP
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            OSIS Portal
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-1">
            Admin Panel
          </span>
        </div>
      </div>
 
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          // Logika untuk menentukan apakah rute ini sedang aktif
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
 
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "opacity-100" : "opacity-70"}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
 
      <div className="mt-auto pt-4 border-t border-slate-100">
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
    </aside>
  );
}