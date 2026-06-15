"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Target,
  Image as ImageIcon,
  Upload,
  X,
  Users,
  Minus,
} from "lucide-react";
import Image from "next/image";

interface ClassData {
  id: number;
  name: string;
}

interface Candidate {
  id: number;
  order_number: string;
  chairman_name: string;
  chairman_photo: string;
  chairman_class_id: number | null;
  vice_chairman_name: string;
  vice_chairman_photo: string;
  vice_chairman_class_id: number | null;
  vision: string;
  mission: string;
  created_at: string;
  vote_count?: number;
  chairman_class_name?: string;
  vice_chairman_class_name?: string;
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

  // Form state
  const [formData, setFormData] = useState({
    order_number: "",
    chairman_name: "",
    chairman_class_id: "",
    vice_chairman_name: "",
    vice_chairman_class_id: "",
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

          let chairmanClassName = "";
          let viceClassName = "";

          if (c.chairman_class_id) {
            const { data: cls } = await supabase
              .from("classes")
              .select("name")
              .eq("id", c.chairman_class_id)
              .single();
            chairmanClassName = cls?.name || "";
          }

          if (c.vice_chairman_class_id) {
            const { data: cls } = await supabase
              .from("classes")
              .select("name")
              .eq("id", c.vice_chairman_class_id)
              .single();
            viceClassName = cls?.name || "";
          }

          return {
            ...c,
            vote_count: count || 0,
            chairman_class_name: chairmanClassName,
            vice_chairman_class_name: viceClassName,
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

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("candidates")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error upload:", error);
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
      } else if (isEdit && selectedCandidate) {
        chairmanPhotoUrl = selectedCandidate.chairman_photo;
      }

      if (vicePhoto) {
        const url = await uploadPhoto(vicePhoto, "vice");
        if (url) vicePhotoUrl = url;
      } else if (isEdit && selectedCandidate) {
        vicePhotoUrl = selectedCandidate.vice_chairman_photo;
      }

      // Gabungkan misi menjadi text dengan newline
      const missionText = missions.filter(m => m.trim()).join("\n");

      const candidateData = {
        order_number: formData.order_number.trim(),
        chairman_name: formData.chairman_name.trim(),
        chairman_photo: chairmanPhotoUrl,
        chairman_class_id: formData.chairman_class_id ? parseInt(formData.chairman_class_id) : null,
        vice_chairman_name: formData.vice_chairman_name.trim(),
        vice_chairman_photo: vicePhotoUrl,
        vice_chairman_class_id: formData.vice_chairman_class_id ? parseInt(formData.vice_chairman_class_id) : null,
        vision: formData.vision.trim(),
        mission: missionText,
      };

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

      if (error) throw error;

      await fetchCandidates();
      resetForm();
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedCandidate) return;

    setSaving(true);

    try {
      // 1. Hapus semua votes yang terkait dengan kandidat ini
      const { error: votesError } = await supabase
        .from("votes")
        .delete()
        .eq("candidate_id", selectedCandidate.id);

      if (votesError) {
        console.error("Error menghapus votes:", votesError);
        throw votesError;
      }

      // 2. Hapus foto dari storage (jika ada)
      if (selectedCandidate.chairman_photo?.includes("candidates")) {
        const path = selectedCandidate.chairman_photo.split("/candidates/")[1];
        if (path) {
          await supabase.storage.from("candidates").remove([path]);
        }
      }
      if (selectedCandidate.vice_chairman_photo?.includes("candidates")) {
        const path = selectedCandidate.vice_chairman_photo.split("/candidates/")[1];
        if (path) {
          await supabase.storage.from("candidates").remove([path]);
        }
      }

      // 3. Baru hapus kandidat
      const { error: candidateError } = await supabase
        .from("candidates")
        .delete()
        .eq("id", selectedCandidate.id);

      if (candidateError) throw candidateError;

      await fetchCandidates();
      setIsDeleteOpen(false);
      setSelectedCandidate(null);
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
      order_number: candidate.order_number || "",
      chairman_name: candidate.chairman_name || "",
      chairman_class_id: candidate.chairman_class_id?.toString() || "",
      vice_chairman_name: candidate.vice_chairman_name || "",
      vice_chairman_class_id: candidate.vice_chairman_class_id?.toString() || "",
      vision: candidate.vision || "",
    });
    setMissions(candidate.mission ? candidate.mission.split("\n").filter(m => m.trim()) : [""]);
    setChairmanPhotoPreview(candidate.chairman_photo || "");
    setVicePhotoPreview(candidate.vice_chairman_photo || "");
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
      chairman_class_id: "",
      vice_chairman_name: "",
      vice_chairman_class_id: "",
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
    c.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" />
            Manajemen Paslon
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data terintegrasi Pasangan Calon Ketua OSIS.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Paslon
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama paslon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm w-20">
                    No.
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Kandidat & Asal Kelas
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Visi Utama
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Misi
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-sm">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      Belum ada paslon terdaftar
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const missionCount = candidate.mission
                      ? candidate.mission.split("\n").filter(m => m.trim()).length
                      : 0;

                    return (
                      <tr
                        key={candidate.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {candidate.order_number.padStart(2, "0")}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-3">
                            {/* Ketua */}
                            <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                                {candidate.chairman_photo ? (
                                <Image
                                    src={candidate.chairman_photo}
                                    alt="Ketua"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                )}
                            </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {candidate.chairman_name}
                                </p>
                                {candidate.chairman_class_name && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium mt-0.5">
                                    <Users className="w-3 h-3" />
                                    {candidate.chairman_class_name} (Ketua)
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Wakil */}
                            <div className="flex items-center gap-3 ml-4 pl-4 border-l-2 border-slate-200">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white shadow-sm">
                                {candidate.vice_chairman_photo ? (
                                <Image
                                    src={candidate.vice_chairman_photo}
                                    alt="Wakil"
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                    unoptimized
                                />
                                ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                )}
                            </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {candidate.vice_chairman_name}
                                </p>
                                {candidate.vice_chairman_class_name && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium mt-0.5">
                                    <Users className="w-3 h-3" />
                                    {candidate.vice_chairman_class_name} (Wakil)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600 max-w-xs">
                          {candidate.vision || "-"}
                        </td>
                        <td className="py-4 px-4">
                          {missionCount > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                              {missionCount} Program
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(candidate)}
                              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(candidate)}
                              className="text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDelete(candidate)}
                              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Total: {filteredCandidates.length} pasangan kandidat terdaftar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form Tambah/Edit */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Data Paslon" : "Registrasi Paslon Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Ubah data pasangan calon yang sudah ada."
                : "Lengkapi informasi untuk menambahkan kandidat baru."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Nomor Urut */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nomor Urut
              </label>
              <Input
                type="number"
                placeholder="Contoh: 1"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                className="max-w-xs"
                min="1"
              />
            </div>

            {/* Calon Ketua & Wakil - 2 Kolom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
              {/* Calon Ketua */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    K
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Calon Ketua</span>
                </div>

                {/* Upload Foto Ketua */}
                <div className="flex justify-center">
                  <label className="relative cursor-pointer group">
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden">
                      {chairmanPhotoPreview ? (
                        <Image
                          src={chairmanPhotoPreview}
                          alt="Preview Ketua"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                          <span className="text-xs text-slate-500">Upload Foto Baru</span>
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

                {/* Nama Ketua */}
                <Input
                  placeholder="Nama Lengkap Ketua"
                  value={formData.chairman_name}
                  onChange={(e) => setFormData({ ...formData, chairman_name: e.target.value })}
                />

                {/* Kelas Ketua */}
                <Select
                  value={formData.chairman_class_id}
                  onValueChange={(val) => setFormData({ ...formData, chairman_class_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calon Wakil */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                    W
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Calon Wakil</span>
                </div>

                {/* Upload Foto Wakil */}
                <div className="flex justify-center">
                  <label className="relative cursor-pointer group">
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden">
                      {vicePhotoPreview ? (
                        <Image
                          src={vicePhotoPreview}
                          alt="Preview Wakil"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                          <span className="text-xs text-slate-500">Upload Foto Baru</span>
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

                {/* Nama Wakil */}
                <Input
                  placeholder="Nama Lengkap Wakil"
                  value={formData.vice_chairman_name}
                  onChange={(e) => setFormData({ ...formData, vice_chairman_name: e.target.value })}
                />

                {/* Kelas Wakil */}
                <Select
                  value={formData.vice_chairman_class_id}
                  onValueChange={(val) => setFormData({ ...formData, vice_chairman_class_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Visi
              </label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Tuliskan visi utama paslon..."
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              />
            </div>

            {/* Misi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Misi (Program Kerja)
                </label>
                <button
                  type="button"
                  onClick={addMission}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah Misi
                </button>
              </div>
              <div className="space-y-2">
                {missions.map((mission, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500 w-6">
                      {idx + 1}.
                    </span>
                    <Input
                      placeholder={`Misi ke-${idx + 1}`}
                      value={mission}
                      onChange={(e) => updateMission(idx, e.target.value)}
                      className="flex-1"
                    />
                    {missions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMission(idx)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? "Mengupload..." : saving ? "Menyimpan..." : "Simpan Data Kandidat"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detail Kandidat */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {selectedCandidate?.order_number.padStart(2, "0")}
              </div>
              <div>
                <div className="text-xl font-bold">Detail Paslon</div>
                <div className="text-xs text-slate-500 font-normal">
                  Pasangan calon nomor urut {selectedCandidate?.order_number}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Foto & Nama */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                  {selectedCandidate?.chairman_photo ? (
                    <Image
                      src={selectedCandidate.chairman_photo}
                      alt="Ketua"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">CALON KETUA</p>
                  <p className="font-bold text-slate-900">
                    {selectedCandidate?.chairman_name}
                  </p>
                  {selectedCandidate?.chairman_class_name && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium mt-1">
                      <Users className="w-3 h-3" />
                      {selectedCandidate.chairman_class_name}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                  {selectedCandidate?.vice_chairman_photo ? (
                    <Image
                      src={selectedCandidate.vice_chairman_photo}
                      alt="Wakil"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">CALON WAKIL</p>
                  <p className="font-bold text-slate-900">
                    {selectedCandidate?.vice_chairman_name}
                  </p>
                  {selectedCandidate?.vice_chairman_class_name && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium mt-1">
                      <Users className="w-3 h-3" />
                      {selectedCandidate.vice_chairman_class_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visi */}
            {selectedCandidate?.vision && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900">Visi</h4>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-600 italic text-center">
                    &quot;{selectedCandidate.vision}&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Misi */}
            {selectedCandidate?.mission && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900">Misi (Program Kerja)</h4>
                </div>
                <div className="space-y-2">
                  {selectedCandidate.mission.split("\n").filter(m => m.trim()).map((m, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start bg-slate-50 rounded-xl p-3 border border-slate-100"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-600">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistik Suara */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium">TOTAL SUARA</p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedCandidate?.vote_count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paslon</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCandidate && (selectedCandidate.vote_count || 0) > 0
                ? `⚠️ PERHATIAN: Paslon "${selectedCandidate?.chairman_name} & ${selectedCandidate?.vice_chairman_name}" sudah memiliki ${(selectedCandidate.vote_count || 0)} suara. Menghapus paslon akan MENGHAPUS SEMUA DATA SUARA terkait. Tindakan ini tidak dapat dibatalkan.`
                : `Apakah Anda yakin ingin menghapus paslon "${selectedCandidate?.chairman_name} & ${selectedCandidate?.vice_chairman_name}"? Tindakan ini tidak dapat dibatalkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCandidate(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}