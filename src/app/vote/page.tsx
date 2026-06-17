"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Eye,
  Target,
  CheckCircle2,
  Gavel,
  Info,
  Check,
  Vote,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { checkVoterSession, submitVote } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";

interface Candidate {
  id: string;
  orderNumber: string;
  chairman: { name: string; image: string };
  viceChairman: { name: string; image: string };
  vision: string;
  missions: string[];
}

export default function VotePage() {
  const router = useRouter();
  const supabase = createClient();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );

  useEffect(() => {
    async function validateSession() {
      const { isValid } = await checkVoterSession();

      if (!isValid) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    }

    validateSession();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    async function fetchCandidates() {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("id");

      if (!error && data) {
        const transformed: Candidate[] = data.map((c, idx) => ({
          id: c.id.toString(),
          orderNumber: String(idx + 1).padStart(2, "0"),
          chairman: {
            name: c.chairman_name || c.name || "Calon Ketua",
            image: c.chairman_photo || c.photo_url || "/placeholder.jpg",
          },
          viceChairman: {
            name: c.vice_chairman_name || "Calon Wakil",
            image: c.vice_chairman_photo || "/placeholder.jpg",
          },
          vision: c.vision || "",
          missions: c.mission ? c.mission.split("\n").filter((m: string) => m.trim()) : [],
        }));
        setCandidates(transformed);
      }
    }

    fetchCandidates();
  }, [loading, supabase]);

  const handleLogout = () => router.replace("/");

  const handleViewDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleVoteConfirmation = () => {
    setIsDrawerOpen(false);
    setIsConfirmOpen(true);
  };

  const finalSubmitVote = async () => {
    if (!selectedCandidate) return;

    setSubmitting(true);

    const result = await submitVote(selectedCandidate.id);

    if (result.success) {
      setIsConfirmOpen(false);
      router.replace("/success");
    } else {
      alert(result.error || "Gagal menyimpan suara. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-[#FAFAFA] to-[#FAFAFA] text-slate-900 antialiased min-h-screen relative flex flex-col font-sans">
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full bg-white/60 backdrop-blur-2xl border-b border-slate-200/50 z-40">
        <div className="flex justify-between items-center h-20 px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              OSIS Portal
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:bg-slate-100 hover:text-red-500 active:scale-95 transition-all p-3 rounded-2xl"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl pt-32 px-6 flex flex-col gap-12 grow w-full pb-12">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Pemilihan Sedang Berlangsung</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Pilih Pemimpinmu
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Gunakan hak suaramu dengan bijak untuk masa depan sekolah yang lebih baik.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {candidates.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-slate-500 text-lg font-medium">Belum ada kandidat yang terdaftar.</p>
            </div>
          ) : (
            candidates.map((paslon, index) => (
              <article
                key={paslon.id}
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 flex flex-col gap-6 relative overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
              >
                {/* Background Number */}
                <div className="absolute -top-10 -right-4 text-[180px] font-black text-slate-900/[0.03] select-none pointer-events-none group-hover:text-indigo-500/5 transition-colors duration-500">
                  {paslon.orderNumber}
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform duration-500">
                    {paslon.orderNumber}
                  </div>
                </div>

                <div className="flex gap-4 z-10">
                  <div className="flex-1 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative group/img">
                    <Image
                      src={paslon.chairman.image}
                      alt={`Calon Ketua ${paslon.orderNumber}`}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-cover group-hover/img:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pt-12">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                        Ketua
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative group/img">
                    <Image
                      src={paslon.viceChairman.image}
                      alt={`Calon Wakil ${paslon.orderNumber}`}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-cover group-hover/img:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pt-12">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                        Wakil
                      </span>
                    </div>
                  </div>
                </div>

                <div className="z-10 mt-2">
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                    {`${paslon.chairman.name} &`}
                    <br />
                    <span className="text-slate-600">{paslon.viceChairman.name}</span>
                  </h3>
                  <button
                    onClick={() => handleViewDetail(paslon)}
                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/10"
                  >
                    <Eye className="w-5 h-5" />
                    Lihat Visi &amp; Misi
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <footer className="mt-auto py-10 w-full border-t border-slate-200/50 bg-white/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto text-center px-6">
          <p className="text-xs text-slate-500 font-bold">
            &copy; 2026 KPU OSIS SMK Budi Bakti Ciwidey
          </p>
          <p className="text-[10px] text-slate-400 mt-2 tracking-widest uppercase font-semibold">
            Dikembangkan oleh Teaching Factory PPLG
          </p>
        </div>
      </footer>

      {/* DRAWER VISI & MISI */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white/95 backdrop-blur-2xl border-t border-slate-200/50 max-h-[90vh] rounded-t-[2.5rem] shadow-2xl">
          <div className="mx-auto w-full max-w-2xl flex flex-col h-full">
            <DrawerHeader className="text-left pb-6 pt-8 px-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <span className="font-black text-xl">
                    {selectedCandidate?.orderNumber}
                  </span>
                </div>
                <div>
                  <DrawerTitle className="text-2xl font-black text-slate-900 tracking-tight">
                    Visi &amp; Misi
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-slate-500 mt-1 font-medium">
                    {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <div className="px-8 pb-8 overflow-y-auto space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-50">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">Visi</h4>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                  <p className="text-base text-slate-600 leading-relaxed italic text-center font-medium">
                    &quot;{selectedCandidate?.vision}&quot;
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-50">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">Misi</h4>
                </div>
                <div className="space-y-4">
                  {selectedCandidate?.missions.map((mission, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-start bg-slate-50/80 rounded-2xl p-5 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-indigo-500/20">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium pt-1">
                        {mission}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <DrawerFooter className="border-t border-slate-100 pt-6 bg-white/80 backdrop-blur-xl px-8 pb-8">
              <button
                onClick={handleVoteConfirmation}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/30 flex justify-center items-center gap-2.5 text-lg"
              >
                <CheckCircle2 className="w-6 h-6" />
                Pilih Kandidat Ini
              </button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ALERT DIALOG KONFIRMASI */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-[2rem] p-8 shadow-2xl flex flex-col gap-6">
          <AlertDialogHeader className="text-left flex flex-row items-center gap-4 space-y-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Info className="w-7 h-7" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              Konfirmasi Pilihan
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-6 flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border-4 border-white shadow-xl relative">
              <Image
                src={selectedCandidate?.chairman.image || ""}
                alt="Foto Kandidat Terpilih"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-md -m-1">
                <Check className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-widest">
                Kandidat Terpilih
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {`Paslon ${selectedCandidate?.orderNumber || ""}`}
              </p>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
              </p>
            </div>
          </div>

          <AlertDialogDescription asChild>
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex gap-4 items-start">
              <div className="p-2 rounded-xl bg-white shadow-sm">
                <Gavel className="w-5 h-5 text-indigo-600 shrink-0" />
              </div>
              <span className="text-sm text-slate-600 leading-relaxed block font-medium pt-0.5">
                Dengan menekan tombol konfirmasi, Anda menggunakan hak suara Anda secara sah. Pilihan tidak dapat diubah setelah disubmit.
              </span>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 mt-2">
            <AlertDialogAction
              onClick={finalSubmitVote}
              disabled={submitting}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black active:scale-[0.98] transition-transform duration-200 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2.5 m-0 disabled:opacity-50 text-lg"
            >
              {submitting ? "Menyimpan..." : "Ya, Saya Yakin"}
              {!submitting && <Vote className="w-6 h-6" />}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-5 bg-transparent border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-bold active:scale-[0.98] transition-transform duration-200 m-0 mt-3 sm:mt-0">
              Batal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}