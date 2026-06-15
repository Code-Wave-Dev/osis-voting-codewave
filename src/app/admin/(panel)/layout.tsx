import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
 
export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased selection:bg-blue-100 selection:text-blue-900">
      <AdminTopBar />
      <AdminSidebar />
 
      {/* Wrapper Konten Utama */}
      <div className="flex-1 md:ml-64 w-full flex flex-col min-h-screen">
        {children}
      </div>
 
      <AdminBottomNav />
    </div>
  );
}
