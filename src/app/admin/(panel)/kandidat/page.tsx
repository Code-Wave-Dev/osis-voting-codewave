"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Megaphone,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Target,
  Image as ImageIcon,
  X,
  Users,
  Award,
  UserCircle,
  Sparkles,
  Briefcase,
} from "lucide-react";
import Image from "next/image";

interface ClassData {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  order_number: number;
  chairman_name: string;
  vice_chairman_name: string;
  vision: string;
  missions: string[];
  photo_urls: {
    chairman: string;
    vice_chairman: string;
  };
  created_at: string;
  vote_count?: number;
}

export default function KandidatPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    order_number: "",
    chairman_name: "",
    vice_chairman_name: "",
    vision: "",
  });
  const [missions, setMissions] = useState<string[]>([""]);
  const [chairmanPhoto, setChairmanPhoto] = useState<File | null>(null);
  const [vicePhoto, setVicePhoto] = useState<File | null>(null);
  const [chairmanPhotoPreview, setChairmanPhotoPreview] = useState<string>("");
  const [vicePhotoPreview, setVicePhotoPreview] = useState<string>("");

  useEffect(() => {
    fetchClasses();
    fetchCandidates();
  }, []);

  async function fetchClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("name");

    if (!error && data) {
      setClasses(data);
    }
  }

  async function fetchCandidates() {
    setLoading(true);

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("order_number");

    if (!error && data) {
      const candidatesWithDetails = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("candidate_id", c.id);

          return {
            ...c,
            vote_count: count || 0,
          };
        })
      );

      setCandidates(candidatesWithDetails);
    }

    setLoading(false);
  }

  function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "chairman" | "vice"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB!");
      return;
    }

    if (type === "chairman") {
      setChairmanPhoto(file);
      setChairmanPhotoPreview(URL.createObjectURL(file));
    } else {
      setVicePhoto(file);
      setVicePhotoPreview(URL.createObjectURL(file));
    }
  }

  async function uploadPhoto(file: File, folder: string): Promise<string | null> {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("candidates")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`Gagal upload foto: ${uploadError.message}\n\nPastikan bucket "candidates" sudah dibuat di Supabase Storage.`);
        return null;
      }

      const { data } = supabase.storage
        .from("candidates")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Error upload:", error);
      alert(`Error upload: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  }

  function addMission() {
    setMissions([...missions, ""]);
  }

  function removeMission(index: number) {
    setMissions(missions.filter((_, i) => i !== index));
  }

  function updateMission(index: number, value: string) {
    const newMissions = [...missions];
    newMissions[index] = value;
    setMissions(newMissions);
  }

  async function handleSave() {
    if (
      !formData.order_number.trim() ||
      !formData.chairman_name.trim() ||
      !formData.vice_chairman_name.trim()
    ) {
      alert("Nomor urut, nama ketua, dan nama wakil wajib diisi!");
      return;
    }

    setSaving(true);

    try {
      let chairmanPhotoUrl = "";
      let vicePhotoUrl = "";

      if (chairmanPhoto) {
        const url = await uploadPhoto(chairmanPhoto, "chairman");
        if (url) chairmanPhotoUrl = url;
      } else if (isEdit && selectedCandidate?.photo_urls?.chairman) {
        chairmanPhotoUrl = selectedCandidate.photo_urls.chairman;
      }

      if (vicePhoto) {
        const url = await uploadPhoto(vicePhoto, "vice");
        if (url) vicePhotoUrl = url;
      } else if (isEdit && selectedCandidate?.photo_urls?.vice_chairman) {
        vicePhotoUrl = selectedCandidate.photo_urls.vice_chairman;
      }

      const missionsArray = missions.filter(m => m.trim());

      const candidateData = {
        order_number: parseInt(formData.order_number.trim()),
        chairman_name: formData.chairman_name.trim(),
        vice_chairman_name: formData.vice_chairman_name.trim(),
        vision: formData.vision.trim(),
        missions: missionsArray,
        photo_urls: {
          chairman: chairmanPhotoUrl,
          vice_chairman: vicePhotoUrl,
        },
      };

      console.log("Saving candidate data:", candidateData);

      let error;
      if (isEdit && selectedCandidate) {
        const res = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", selectedCandidate.id);
        error = res.error;
      } else {
        const res = await supabase.from("candidates").insert([candidateData]);
        error = res.error;
      }

      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message || "Gagal menyimpan data");
      }

      await fetchCandidates();
      resetForm();
      alert("Data berhasil disimpan!");
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Gagal menyimpan: ${err.message}`);
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedCandidate) return;

    setSaving(true);

    try {
      const { error: votesError } = await supabase
        .from("votes")
        .delete()
        .eq("candidate_id", selectedCandidate.id);

      if (votesError) {
        console.error("Error menghapus votes:", votesError);
        throw votesError;
      }

      if (selectedCandidate.photo_urls?.chairman?.includes("candidates")) {
        const path = selectedCandidate.photo_urls.chairman.split("/candidates/")[1];
        if (path) {
          await supabase.storage.from("candidates").remove([path]);
        }
      }
      if (selectedCandidate.photo_urls?.vice_chairman?.includes("candidates")) {
        const path = selectedCandidate.photo_urls.vice_chairman.split("/candidates/")[1];
        if (path) {
          await supabase.storage.from("candidates").remove([path]);
        }
      }

      const { error: candidateError } = await supabase
        .from("candidates")
        .delete()
        .eq("id", selectedCandidate.id);

      if (candidateError) throw candidateError;

      await fetchCandidates();
      setIsDeleteOpen(false);
      setSelectedCandidate(null);
      alert("Data berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }

    setSaving(false);
  }

  function openAdd() {
    setIsEdit(false);
    resetForm();
    setIsFormOpen(true);
  }

  function openEdit(candidate: Candidate) {
    setIsEdit(true);
    setSelectedCandidate(candidate);
    setFormData({
      order_number: candidate.order_number?.toString() || "",
      chairman_name: candidate.chairman_name || "",
      vice_chairman_name: candidate.vice_chairman_name || "",
      vision: candidate.vision || "",
    });
    setMissions(candidate.missions && candidate.missions.length > 0 ? candidate.missions : [""]);
    setChairmanPhotoPreview(candidate.photo_urls?.chairman || "");
    setVicePhotoPreview(candidate.photo_urls?.vice_chairman || "");
    setChairmanPhoto(null);
    setVicePhoto(null);
    setIsFormOpen(true);
  }

  function openDetail(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  }

  function openDelete(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setIsDeleteOpen(true);
  }

  function resetForm() {
    setFormData({
      order_number: "",
      chairman_name: "",
      vice_chairman_name: "",
      vision: "",
    });
    setMissions([""]);
    setChairmanPhoto(null);
    setVicePhoto(null);
    setChairmanPhotoPreview("");
    setVicePhotoPreview("");
    setSelectedCandidate(null);
    setIsFormOpen(false);
  }

  const filteredCandidates = candidates.filter((c) =>
    c.chairman_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vice_chairman_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.order_number.toString().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b-2 border-slate-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/30">
            <Megaphone className="w-5 h-5 text-white" />
            <span className="text-sm font-black text-white uppercase tracking-widest">Manajemen Kandidat</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tight">
            Pasangan Calon
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl">
            Kelola data terintegrasi Pasangan Calon Ketua OSIS dengan mudah dan efisien
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black px-10 py-7 rounded-3xl shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all text-lg"
        >
          <Plus className="mr-3 h-6 w-6" /> Tambah Paslon
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border-2 border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl p-3">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Input
              placeholder="Cari nama paslon atau nomor urut..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 h-16 text-lg font-medium border-0 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 bg-slate-50"
            />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-8 shadow-2xl shadow-indigo-500/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-black text-white/90 uppercase tracking-widest">Total</span>
            </div>
            <p className="text-6xl font-black text-white tracking-tight">{candidates.length}</p>
            <p className="text-base text-white/90 font-bold mt-2">Pasangan Kandidat</p>
          </div>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl p-20 text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-8">
              <Users className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-700 mb-3">Belum ada paslon terdaftar</p>
            <p className="text-base text-slate-500">Klik tombol "Tambah Paslon" untuk menambahkan kandidat baru</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const missionCount = candidate.missions?.length || 0;

            return (
              <div
                key={candidate.id}
                className="bg-white border-2 border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 group"
              >
                {/* Header with Order Number */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 pb-20">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/30 shadow-2xl">
                      <span className="text-3xl font-black text-white">
                        {candidate.order_number.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetail(candidate)}
                        className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors border-2 border-white/30"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEdit(candidate)}
                        className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors border-2 border-white/30"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDelete(candidate)}
                        className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-red-500/50 transition-colors border-2 border-white/30"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div className="px-8 -mt-12 relative z-10">
                  <div className="flex gap-4">
                    <div className="flex-1 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative group/img">
                      {candidate.photo_urls?.chairman ? (
                        <Image
                          src={candidate.photo_urls.chairman}
                          alt="Ketua"
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <UserCircle className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pt-12">
                        <span className="text-white text-xs font-black uppercase tracking-widest">
                          Ketua
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100 relative group/img">
                      {candidate.photo_urls?.vice_chairman ? (
                        <Image
                          src={candidate.photo_urls.vice_chairman}
                          alt="Wakil"
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <UserCircle className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pt-12">
                        <span className="text-white text-xs font-black uppercase tracking-widest">
                          Wakil
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Calon Ketua</p>
                      <p className="font-black text-slate-900 text-2xl leading-tight">
                        {candidate.chairman_name}
                      </p>
                    </div>
                    <div className="pt-4 border-t-2 border-slate-100">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Calon Wakil</p>
                      <p className="font-black text-slate-900 text-2xl leading-tight">
                        {candidate.vice_chairman_name}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-slate-100">
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5 border-2 border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Misi</span>
                      </div>
                      <p className="text-3xl font-black text-indigo-600">{missionCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Suara</span>
                      </div>
                      <p className="text-3xl font-black text-emerald-600">{candidate.vote_count || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

     {/* Dialog Form Tambah/Edit - RESPONSIVE */}
<Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
  <DialogContent
    className="max-h-[95vh] overflow-y-auto rounded-3xl border-2 border-slate-200 shadow-2xl p-0"
    style={{
      // Desktop: fixed max width, Mobile: full width
      maxWidth: 'min(1200px, 95vw)',
      width: '100%',
    }}
  >
    <DialogTitle className="sr-only">
      {isEdit ? "Edit Data Paslon" : "Registrasi Paslon Baru"}
    </DialogTitle>
    
    {/* Header - Responsive */}
    <div className="sticky top-0 bg-white border-b-2 border-slate-100 p-6 md:p-8 z-10 rounded-t-3xl">
      <div className="flex items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-5 flex-1">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 shrink-0">
            {isEdit ? <Edit className="w-5 h-5 md:w-7 md:h-7 text-white" /> : <Plus className="w-5 h-5 md:w-7 md:h-7 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-4xl font-black text-slate-900 leading-tight">
              {isEdit ? "Edit Data Paslon" : "Registrasi Paslon Baru"}
            </h2>
            <p className="text-sm md:text-lg text-slate-500 font-medium mt-1 md:mt-2 hidden md:block">
              {isEdit
                ? "Ubah data pasangan calon yang sudah ada"
                : "Lengkapi informasi untuk menambahkan kandidat baru"}
            </p>
          </div>
        </div>
        <button
          onClick={() => resetForm()}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
        </button>
      </div>
      {/* Mobile subtitle */}
      <p className="text-sm text-slate-500 font-medium mt-2 md:hidden">
        {isEdit
          ? "Ubah data pasangan calon"
          : "Tambah kandidat baru"}
      </p>
    </div>

    {/* Body - Responsive */}
    <div className="p-4 md:p-10 space-y-6 md:space-y-10">
      {/* Nomor Urut */}
      <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-indigo-100">
        <label className="text-xs md:text-sm font-black text-indigo-900 uppercase tracking-widest mb-3 md:mb-4 block">
          Nomor Urut
        </label>
        <Input
          type="number"
          placeholder="Contoh: 1"
          value={formData.order_number}
          onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
          className="h-12 md:h-16 text-lg md:text-2xl font-bold border-2 border-indigo-200 rounded-xl md:rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 bg-white"
          min="1"
        />
      </div>

      {/* Calon Ketua dan Wakil - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Calon Ketua */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-violet-50/70 to-purple-50/70 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-indigo-200 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b-2 border-indigo-200">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg md:text-2xl shadow-xl shadow-indigo-500/30 shrink-0">
              K
            </div>
            <div>
              <span className="text-base md:text-2xl font-black text-slate-900 block">Calon Ketua</span>
              <span className="text-xs md:text-sm text-slate-500 font-medium hidden md:block">Lengkapi data calon ketua</span>
            </div>
          </div>

          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl md:rounded-3xl border-4 border-dashed border-indigo-300 bg-white flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all overflow-hidden shadow-xl">
                {chairmanPhotoPreview ? (
                  <Image
                    src={chairmanPhotoPreview}
                    alt="Preview Ketua"
                    width={192}
                    height={192}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 md:w-10 md:h-10 text-indigo-600" />
                    </div>
                    <span className="text-xs md:text-base font-bold text-indigo-600 text-center px-2">Upload Foto</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoChange(e, "chairman")}
              />
            </label>
          </div>

          <div className="space-y-3 md:space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 md:mb-3 block">
                Nama Lengkap
              </label>
              <Input
                placeholder="Nama lengkap ketua"
                value={formData.chairman_name}
                onChange={(e) => setFormData({ ...formData, chairman_name: e.target.value })}
                className="h-11 md:h-16 text-base md:text-lg border-2 border-slate-200 rounded-xl md:rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Calon Wakil */}
        <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-slate-200 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b-2 border-slate-200">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-black text-lg md:text-2xl shadow-xl shrink-0">
              W
            </div>
            <div>
              <span className="text-base md:text-2xl font-black text-slate-900 block">Calon Wakil</span>
              <span className="text-xs md:text-sm text-slate-500 font-medium hidden md:block">Lengkapi data calon wakil</span>
            </div>
          </div>

          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl md:rounded-3xl border-4 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-slate-500 hover:bg-slate-50 transition-all overflow-hidden shadow-xl">
                {vicePhotoPreview ? (
                  <Image
                    src={vicePhotoPreview}
                    alt="Preview Wakil"
                    width={192}
                    height={192}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 md:w-10 md:h-10 text-slate-600" />
                    </div>
                    <span className="text-xs md:text-base font-bold text-slate-600 text-center px-2">Upload Foto</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoChange(e, "vice")}
              />
            </label>
          </div>

          <div className="space-y-3 md:space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 md:mb-3 block">
                Nama Lengkap
              </label>
              <Input
                placeholder="Nama lengkap wakil"
                value={formData.vice_chairman_name}
                onChange={(e) => setFormData({ ...formData, vice_chairman_name: e.target.value })}
                className="h-11 md:h-16 text-base md:text-lg border-2 border-slate-200 rounded-xl md:rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visi */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-amber-100">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          <label className="text-xs md:text-sm font-black text-amber-900 uppercase tracking-widest">
            Visi
          </label>
        </div>
        <textarea
          className="w-full min-h-[100px] md:min-h-[160px] px-4 md:px-6 py-3 md:py-4 border-2 border-amber-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 text-sm md:text-lg font-medium bg-white resize-none"
          placeholder="Tuliskan visi utama paslon..."
          value={formData.vision}
          onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
        />
      </div>

      {/* Misi */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-emerald-100">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            <label className="text-xs md:text-sm font-black text-emerald-900 uppercase tracking-widest">
              Misi
            </label>
          </div>
          <button
            type="button"
            onClick={addMission}
            className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs md:text-base font-bold rounded-lg md:rounded-xl flex items-center gap-1 md:gap-2 transition-all shadow-xl shadow-emerald-500/30"
          >
            <Plus className="w-3 h-3 md:w-5 md:h-5" /> <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
        <div className="space-y-3">
          {missions.map((mission, idx) => (
            <div key={idx} className="flex items-center gap-3 md:gap-5 group">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-sm md:text-lg shadow-xl shadow-emerald-500/30 shrink-0">
                {idx + 1}
              </div>
              <Input
                placeholder={`Misi ke-${idx + 1}`}
                value={mission}
                onChange={(e) => updateMission(idx, e.target.value)}
                className="flex-1 h-10 md:h-16 text-sm md:text-lg border-2 border-slate-200 rounded-xl md:rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
              />
              {missions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMission(idx)}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors border-2 border-red-200 shrink-0"
                >
                  <X className="w-4 h-4 md:w-6 md:h-6" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons - Responsive */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-5 pt-6 md:pt-8 border-t-2 border-slate-100">
        <Button
          onClick={() => resetForm()}
          variant="outline"
          className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-50 text-sm md:text-lg"
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full sm:w-auto px-6 md:px-12 py-4 md:py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl md:rounded-2xl font-black shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all disabled:opacity-50 text-sm md:text-lg"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2 md:gap-3">
              <div className="w-4 h-4 md:w-6 md:h-6 border-2 md:border-3 border-white/30 border-t-white rounded-full animate-spin" />
              Mengupload...
            </span>
          ) : saving ? (
            <span className="flex items-center justify-center gap-2 md:gap-3">
              <div className="w-4 h-4 md:w-6 md:h-6 border-2 md:border-3 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : (
            "Simpan Data"
          )}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

      {/* Dialog Detail Kandidat */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent
          className="w-full max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-slate-200 shadow-2xl"
          style={{
            maxWidth: '90vw',
            width: '90vw',
            padding: 0,
          }}
        >
          <DialogTitle className="sr-only">Detail Paslon</DialogTitle>
          
          <div className="sticky top-0 bg-white border-b-2 border-slate-100 p-8 z-10 rounded-t-3xl">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                <span className="text-3xl font-black text-white">
                  {selectedCandidate?.order_number.toString().padStart(2, "0")}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900">Detail Paslon</h2>
                <p className="text-base text-slate-500 font-medium mt-2">
                  Pasangan calon nomor urut {selectedCandidate?.order_number}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center space-y-5">
                <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 relative border-4 border-white shadow-2xl">
                  {selectedCandidate?.photo_urls?.chairman ? (
                    <Image
                      src={selectedCandidate.photo_urls.chairman}
                      alt="Ketua"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <UserCircle className="w-24 h-24" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-3">Calon Ketua</p>
                  <p className="font-black text-slate-900 text-2xl">
                    {selectedCandidate?.chairman_name}
                  </p>
                </div>
              </div>
              <div className="text-center space-y-5">
                <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 relative border-4 border-white shadow-2xl">
                  {selectedCandidate?.photo_urls?.vice_chairman ? (
                    <Image
                      src={selectedCandidate.photo_urls.vice_chairman}
                      alt="Wakil"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <UserCircle className="w-24 h-24" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Calon Wakil</p>
                  <p className="font-black text-slate-900 text-2xl">
                    {selectedCandidate?.vice_chairman_name}
                  </p>
                </div>
              </div>
            </div>

            {selectedCandidate?.vision && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-50">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-2xl">Visi</h4>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-100">
                  <p className="text-lg text-slate-700 italic text-center font-medium leading-relaxed">
                    &quot;{selectedCandidate.vision}&quot;
                  </p>
                </div>
              </div>
            )}

            {selectedCandidate?.missions && selectedCandidate.missions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <Briefcase className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-black text-slate-900 text-2xl">Misi (Program Kerja)</h4>
                </div>
                <div className="space-y-4">
                  {selectedCandidate.missions.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex gap-5 items-start bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 hover:bg-white hover:shadow-xl transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-emerald-500/30 shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-base text-slate-700 font-medium pt-3">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 border-2 border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-3">Total Suara</p>
                  <p className="text-6xl font-black text-emerald-600">
                    {selectedCandidate?.vote_count || 0}
                  </p>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <Award className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-2 border-slate-200 shadow-2xl p-0">
          <AlertDialogTitle className="sr-only">Hapus Paslon</AlertDialogTitle>
          
          <div className="p-8 border-b-2 border-slate-100">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border-2 border-red-100">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Hapus Paslon</h2>
            </div>
          </div>
          <div className="p-8">
            <AlertDialogDescription asChild>
              <p className="text-base text-slate-600 font-medium">
                {selectedCandidate && (selectedCandidate.vote_count || 0) > 0 ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <p className="text-red-800 font-bold mb-3 text-lg">⚠️ PERHATIAN</p>
                    <p className="text-red-700 leading-relaxed">
                      Paslon "{selectedCandidate?.chairman_name} & {selectedCandidate?.vice_chairman_name}" sudah memiliki <strong>{selectedCandidate.vote_count} suara</strong>. Menghapus paslon akan <strong>MENGHAPUS SEMUA DATA SUARA</strong> terkait. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                ) : (
                  <p className="text-lg">
                    Apakah Anda yakin ingin menghapus paslon "{selectedCandidate?.chairman_name} & {selectedCandidate?.vice_chairman_name}"? Tindakan ini tidak dapat dibatalkan.
                  </p>
                )}
              </p>
            </AlertDialogDescription>
          </div>
          <div className="p-8 pt-0 flex justify-end gap-4">
            <AlertDialogCancel className="px-8 py-5 rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-50 text-lg">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="px-8 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-xl shadow-red-500/30 active:scale-95 transition-all disabled:opacity-50 text-lg"
            >
              {saving ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}