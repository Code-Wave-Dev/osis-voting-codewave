"use client";
 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Vote, BarChart3, ShieldCheck } from "lucide-react";
 
export function AdminBottomNav() {
  const pathname = usePathname();
 
  // Bottom Nav ini berfokus pada perpindahan cepat di layar sentuh
  const navItems = [
    { name: "Home", href: "/", icon: Home, exact: true },
    { name: "Kandidat", href: "/vote", icon: Vote },
    { name: "Hasil", href: "/admin/statistik", icon: BarChart3 },
    { name: "Admin", href: "/admin/dashboard", icon: ShieldCheck },
  ];
 
  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] z-50 pb-safe">
      <div className="flex justify-around items-center px-2 py-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.name === "Admin" && pathname.startsWith("/admin/dashboard"));
 
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-transform active:scale-95 ${
                isActive
                  ? "bg-blue-50 text-blue-600 rounded-xl px-4 py-2"
                  : "text-slate-400 p-2 hover:text-blue-600"
              }`}
            >
              <item.icon
                className={`w-6 h-6 mb-1 ${isActive ? "fill-current opacity-20" : ""}`}
              />
              <span
                className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
