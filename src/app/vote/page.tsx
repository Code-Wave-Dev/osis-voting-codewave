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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 antialiased min-h-screen relative flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 z-40 shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">
            OSIS Portal
          </h1>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:bg-slate-100 hover:text-red-500 active:scale-95 transition-all p-2 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl pt-24 px-6 flex flex-col gap-8 grow w-full">
        <section className="text-center mt-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Pilih Pemimpinmu
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Gunakan hak suaramu dengan bijak untuk masa depan sekolah yang lebih baik.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-slate-500 text-lg">Belum ada kandidat yang terdaftar.</p>
            </div>
          ) : (
            candidates.map((paslon, index) => (
              <article
                key={paslon.id}
                className="bg-white/90 backdrop-blur-lg border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute -top-8 -right-4 text-[150px] font-bold text-blue-600/5 select-none pointer-events-none">
                  {paslon.orderNumber}
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                    {paslon.orderNumber}
                  </div>
                </div>

                <div className="flex gap-4 z-10">
                  <div className="flex-1 aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 relative group">
                    <Image
                      src={paslon.chairman.image}
                      alt={`Calon Ketua ${paslon.orderNumber}`}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-10">
                      <span className="text-white text-xs font-semibold">
                        Ketua
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 relative group">
                    <Image
                      src={paslon.viceChairman.image}
                      alt={`Calon Wakil ${paslon.orderNumber}`}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-10">
                      <span className="text-white text-xs font-semibold">
                        Wakil
                      </span>
                    </div>
                  </div>
                </div>

                <div className="z-10 mt-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-4">
                    {`${paslon.chairman.name} &`}
                    <br />
                    {paslon.viceChairman.name}
                  </h3>
                  <button
                    onClick={() => handleViewDetail(paslon)}
                    className="w-full py-3.5 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold active:scale-[0.98] transition-all duration-200 hover:bg-blue-50 flex items-center justify-center gap-2"
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

      <footer className="mt-12 py-8 w-full border-t border-slate-200 bg-white/50">
        <div className="max-w-6xl mx-auto text-center px-6">
          <p className="text-xs text-slate-500 font-medium">
            &copy; 2026 KPU OSIS SMK Budi Bakti Ciwidey
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide">
            Dikembangkan oleh Teaching Factory PPLG
          </p>
        </div>
      </footer>

      {/* DRAWER VISI & MISI */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white/95 backdrop-blur-xl border-t border-slate-200 max-h-[90vh]">
          <div className="mx-auto w-full max-w-2xl flex flex-col h-full">
            <DrawerHeader className="text-left border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <span className="font-bold text-xl">
                    {selectedCandidate?.orderNumber}
                  </span>
                </div>
                <div>
                  <DrawerTitle className="text-xl font-bold text-slate-900">
                    Visi &amp; Misi
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-slate-500 mt-0.5">
                    {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <div className="p-6 overflow-y-auto space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-900">Visi</h4>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed italic text-center">
                    &quot;{selectedCandidate?.vision}&quot;
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-900">Misi</h4>
                </div>
                <div className="space-y-3">
                  {selectedCandidate?.missions.map((mission, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start bg-slate-50 rounded-xl p-4 border border-slate-100"
                    >
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {mission}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <DrawerFooter className="border-t border-slate-100 pt-4 bg-white/80">
              <button
                onClick={handleVoteConfirmation}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 flex justify-center items-center gap-2 hover:bg-blue-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                Pilih Kandidat Ini
              </button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ALERT DIALOG KONFIRMASI */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-auto bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
          <AlertDialogHeader className="text-left flex flex-row items-center gap-3 space-y-0">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Konfirmasi Pilihan Anda
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white shadow-md relative">
              <Image
                src={selectedCandidate?.chairman.image || ""}
                alt="Foto Kandidat Terpilih"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">
                Kandidat Terpilih
              </p>
              <p className="text-xl font-bold text-slate-900">
                {`Paslon No. ${selectedCandidate?.orderNumber || ""}`}
              </p>
              <p className="text-sm text-slate-600">
                {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
              </p>
            </div>
          </div>

          <AlertDialogDescription asChild>
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3 items-start">
              <Gavel className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 leading-relaxed block">
                Dengan menekan tombol konfirmasi, Anda menggunakan hak suara Anda secara sah. Pilihan tidak dapat diubah setelah disubmit.
              </span>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 mt-2">
            <AlertDialogAction
              onClick={finalSubmitVote}
              disabled={submitting}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform duration-200 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 m-0 disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Ya, Saya Yakin"}
              {!submitting && <Vote className="w-5 h-5" />}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-5 bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold active:scale-[0.98] transition-transform duration-200 m-0 mt-3 sm:mt-0">
              Batal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}