import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";
 
export async function proxy(request: NextRequest) {
  // Melewati request ke fungsi updateSession yang telah kita buat
  return await updateSession(request);
}
 
// Konfigurasi agar Middleware hanya memantau rute tertentu (menghemat performa)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
