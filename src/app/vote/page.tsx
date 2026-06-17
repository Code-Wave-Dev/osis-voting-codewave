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
  UserCircle,
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
  const [isExpanded, setIsExpanded] = useState(false);

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
        .order("order_number");

      if (!error && data) {
        const transformed: Candidate[] = data.map((c, idx) => {
          const photoUrls = c.photo_urls || {};
          const chairmanImage = photoUrls.chairman || "";
          const viceChairmanImage = photoUrls.vice_chairman || "";

          let missionsArray: string[] = [];
          if (Array.isArray(c.missions)) {
            missionsArray = c.missions.filter((m: string) => m.trim());
          } else if (typeof c.missions === "string") {
            missionsArray = c.missions.split("\n").filter((m: string) => m.trim());
          }

          return {
            id: c.id.toString(),
            orderNumber: String(c.order_number || idx + 1).padStart(2, "0"),
            chairman: {
              name: c.chairman_name || "Calon Ketua",
              image: chairmanImage,
            },
            viceChairman: {
              name: c.vice_chairman_name || "Calon Wakil",
              image: viceChairmanImage,
            },
            vision: c.vision || "",
            missions: missionsArray,
          };
        });
        setCandidates(transformed);
      }
    }

    fetchCandidates();
  }, [loading, supabase]);

  const handleLogout = () => router.replace("/");

  const handleViewDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsExpanded(false); // Reset ke collapsed saat buka drawer
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

  // FIX: Fungsi untuk handle scroll dan auto-expand drawer
  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Expand drawer when user scrolls more than 50px
    if (e.currentTarget.scrollTop > 50 && !isExpanded) {
      setIsExpanded(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen relative flex flex-col font-sans">
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              OSIS Portal
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:bg-slate-100 hover:text-red-600 active:scale-95 transition-all p-2 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl pt-24 px-4 md:px-6 flex flex-col gap-8 grow w-full pb-12">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pemilihan Sedang Berlangsung</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            Pilih Pemimpinmu
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-medium">
            Gunakan hak suaramu dengan bijak untuk masa depan sekolah yang lebih baik.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-slate-500 text-lg font-medium">Belum ada kandidat yang terdaftar.</p>
            </div>
          ) : (
            candidates.map((paslon, index) => (
              <article
                key={paslon.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="absolute -top-8 -right-4 text-[150px] font-black text-blue-900/[0.04] select-none pointer-events-none">
                  {paslon.orderNumber}
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {paslon.orderNumber}
                  </div>
                </div>

                <div className="flex gap-3 z-10">
                  <div className="flex-1 aspect-square rounded-xl overflow-hidden border-2 border-white shadow-lg bg-slate-100 relative group/img">
                    {paslon.chairman.image ? (
                      <Image
                        src={paslon.chairman.image}
                        alt={`Calon Ketua ${paslon.orderNumber}`}
                        fill
                        unoptimized
                        priority={index === 0}
                        className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-10">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                        Ketua
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-square rounded-xl overflow-hidden border-2 border-white shadow-lg bg-slate-100 relative group/img">
                    {paslon.viceChairman.image ? (
                      <Image
                        src={paslon.viceChairman.image}
                        alt={`Calon Wakil ${paslon.orderNumber}`}
                        fill
                        unoptimized
                        priority={index === 0}
                        className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 pt-10">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                        Wakil
                      </span>
                    </div>
                  </div>
                </div>

                <div className="z-10 mt-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-4">
                    {`${paslon.chairman.name} &`}
                    <br />
                    <span className="text-slate-600">{paslon.viceChairman.name}</span>
                  </h3>
                  <button
                    onClick={() => handleViewDetail(paslon)}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
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

      <footer className="mt-auto py-8 w-full border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto text-center px-6">
          <p className="text-xs text-slate-500 font-medium">
            &copy; 2026 KPU OSIS SMK Budi Bakti Ciwidey
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide">
            Dikembangkan oleh Teaching Factory PPLG
          </p>
        </div>
      </footer>

      {/* DRAWER VISI & MISI - WITH SMOOTH EXPAND */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent 
          className={`bg-white border-t border-slate-200 shadow-2xl transition-all duration-500 ease-out ${
            isExpanded ? 'h-[85vh] max-h-[700px]' : 'h-[50vh] min-h-[400px]'
          }`}
        >
          {/* FIX: DialogTitle untuk accessibility */}
          <DrawerTitle className="sr-only">
            Visi dan Misi {selectedCandidate?.chairman.name}
          </DrawerTitle>
          
          {/* Container dengan flex */}
          <div className="flex flex-col h-full w-full mx-auto max-w-2xl">
            
            {/* Header - Fixed */}
            <div className="shrink-0 border-b border-slate-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                  <span className="font-black text-lg">
                    {selectedCandidate?.orderNumber}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Visi &amp; Misi
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium truncate">
                    {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                >
                  <span className="text-slate-500 text-xl leading-none">&times;</span>
                </button>
              </div>
            </div>

            {/* Content - Scrollable dengan handler */}
            <div 
              className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth"
              onScroll={handleContentScroll}
            >
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Visi</h4>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-slate-700 leading-relaxed italic text-center font-medium">
                    &quot;{selectedCandidate?.vision || 'Belum ada visi'}&quot;
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Misi</h4>
                </div>
                <div className="space-y-3">
                  {selectedCandidate?.missions && selectedCandidate.missions.length > 0 ? (
                    selectedCandidate.missions.map((mission, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 items-start bg-blue-50 rounded-xl p-4 border border-blue-100"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium pt-0.5">
                          {mission}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4">Belum ada misi yang ditambahkan.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer - Fixed */}
            <div className="shrink-0 border-t border-slate-200 p-5 bg-white">
              <button
                onClick={handleVoteConfirmation}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg flex justify-center items-center gap-2.5 text-base"
              >
                <CheckCircle2 className="w-5 h-5" />
                Pilih Kandidat Ini
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ALERT DIALOG KONFIRMASI */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
          <AlertDialogHeader className="text-left flex flex-row items-center gap-3 space-y-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              Konfirmasi Pilihan
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-4 border-white shadow-lg relative">
              {selectedCandidate?.chairman.image ? (
                <Image
                  src={selectedCandidate.chairman.image}
                  alt="Foto Kandidat Terpilih"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <UserCircle className="w-10 h-10" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-md -m-1">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">
                Kandidat Terpilih
              </p>
              <p className="text-xl font-black text-slate-900 tracking-tight truncate">
                {`Paslon ${selectedCandidate?.orderNumber || ""}`}
              </p>
              <p className="text-sm text-slate-600 font-medium mt-1 truncate">
                {`${selectedCandidate?.chairman.name || ""} & ${selectedCandidate?.viceChairman.name || ""}`}
              </p>
            </div>
          </div>

          <AlertDialogDescription asChild>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                <Gavel className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-600 leading-relaxed block font-medium">
                Dengan menekan tombol konfirmasi, Anda menggunakan hak suara Anda secara sah. Pilihan tidak dapat diubah setelah disubmit.
              </span>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="flex-col gap-3 sm:flex-col sm:space-x-0 mt-2">
            <AlertDialogAction
              onClick={finalSubmitVote}
              disabled={submitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold active:scale-[0.98] transition-transform duration-200 shadow-lg flex items-center justify-center gap-2.5 m-0 disabled:opacity-50 text-base"
            >
              {submitting ? "Menyimpan..." : "Ya, Saya Yakin"}
              {!submitting && <Vote className="w-5 h-5" />}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-4 bg-transparent border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold active:scale-[0.98] transition-transform duration-200 m-0">
              Batal
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}