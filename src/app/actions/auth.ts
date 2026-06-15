"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// ==========================================
// FUNGSI LOGIN ADMIN
// ==========================================
export async function loginAdmin(formData: FormData) {
  const email = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }

  try {
    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return {
        success: false,
        error: "Kredensial salah atau akun tidak ditemukan.",
      };
    }

    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Akses ditolak. Anda bukan administrator resmi.",
      };
    }

    return { success: true, role: adminData.role };
  } catch (err) {
    console.error("Kesalahan sistem saat login admin:", err);
    return { success: false, error: "Terjadi kesalahan internal pada server." };
  }
}

// ==========================================
// FUNGSI LOGOUT ADMIN
// ==========================================
export async function logoutAdmin() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    console.error("Kesalahan sistem saat logout:", err);
    return { success: false, error: "Gagal melakukan logout." };
  }
}

// ==========================================
// FUNGSI VERIFIKASI PIN SISWA
// ==========================================
export async function verifyVoterPin(pin: string) {
  if (!pin || pin.length !== 6) {
    return { success: false, error: "PIN harus terdiri dari 6 digit." };
  }

  try {
    const supabase = await createClient();

    // Cek apakah PIN ada dan belum digunakan
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("pin", pin)
      .eq("is_used", false)
      .single();

    if (tokenError || !tokenData) {
      return {
        success: false,
        error: "PIN tidak terdaftar atau sudah digunakan.",
      };
    }

    // Simpan token ID ke cookie untuk session
    const cookieStore = await cookies();
    cookieStore.set("voter_token_id", tokenData.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 30, // 30 menit
      path: "/",
    });

    return { success: true, tokenId: tokenData.id };
  } catch (err) {
    console.error("Kesalahan sistem saat verifikasi PIN siswa:", err);
    return { success: false, error: "Terjadi kesalahan internal pada server." };
  }
}

// ==========================================
// FUNGSI CEK SESSION SISWA
// ==========================================
export async function checkVoterSession() {
  try {
    const cookieStore = await cookies();
    const tokenId = cookieStore.get("voter_token_id")?.value;

    if (!tokenId) {
      return { isValid: false };
    }

    const supabase = await createClient();

    // Cek apakah token masih valid dan belum digunakan
    const { data: tokenData, error } = await supabase
      .from("tokens")
      .select("id, is_used")
      .eq("id", tokenId)
      .eq("is_used", false)
      .single();

    return { isValid: !error && !!tokenData };
  } catch (err) {
    console.error("Error checkVoterSession:", err);
    return { isValid: false };
  }
}

// ==========================================
// FUNGSI TANDAI TOKEN SUDAH DIGUNAKAN
// ==========================================
export async function markTokenAsUsed() {
  try {
    const cookieStore = await cookies();
    const tokenId = cookieStore.get("voter_token_id")?.value;

    if (!tokenId) {
      return { success: false };
    }

    const supabase = await createClient();

    // Update status token menjadi sudah digunakan
    const { error } = await supabase
      .from("tokens")
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .eq("id", tokenId);

    if (!error) {
      // Hapus cookie session
      cookieStore.delete("voter_token_id");
      return { success: true };
    }

    return { success: false };
  } catch (err) {
    console.error("Error markTokenAsUsed:", err);
    return { success: false };
  }
}

// ==========================================
// FUNGSI SIMPAN VOTE
// ==========================================
export async function submitVote(candidateId: string) {
  try {
    const cookieStore = await cookies();
    const tokenId = cookieStore.get("voter_token_id")?.value;

    if (!tokenId) {
      return { success: false, error: "Session tidak valid." };
    }

    const supabase = await createClient();

    // Simpan vote ke database
    const { error } = await supabase.from("votes").insert([
      {
        token_id: tokenId,
        candidate_id: candidateId,
        voted_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error submitVote:", error);
      return { success: false, error: "Gagal menyimpan suara." };
    }

    // Tandai token sebagai sudah digunakan
    await markTokenAsUsed();

    return { success: true };
  } catch (err) {
    console.error("Error submitVote:", err);
    return { success: false, error: "Terjadi kesalahan sistem." };
  }
}