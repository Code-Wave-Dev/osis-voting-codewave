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
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
} from "lucide-react";

interface ClassData {
  id: number;
  name: string;
  created_at: string;
  token_count?: number;
  used_count?: number;
}

export default function KelasPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [className, setClassName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .order("name");

    if (!classError && classData) {
      const classesWithStats = await Promise.all(
        classData.map(async (cls) => {
          const { count: totalCount } = await supabase
            .from("tokens")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);

          const { count: usedCount } = await supabase
            .from("tokens")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)
            .eq("is_used", true);

          return {
            ...cls,
            token_count: totalCount || 0,
            used_count: usedCount || 0,
          };
        })
      );

      setClasses(classesWithStats);
    }

    setLoading(false);
  }

  // Deteksi tingkat dari nama kelas
  function detectLevel(className: string): string {
    const upper = className.toUpperCase();
    if (upper.startsWith("XII") || upper.startsWith("12")) return "Kelas 12";
    if (upper.startsWith("XI") || upper.startsWith("11")) return "Kelas 11";
    if (upper.startsWith("X") || upper.startsWith("10")) return "Kelas 10";
    return "Lainnya";
  }

  // Format tanggal ke bahasa Indonesia
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  async function handleAdd() {
    if (!className.trim()) {
      alert("Nama kelas tidak boleh kosong!");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("classes").insert([
      { name: className.trim().toUpperCase() },
    ]);

    if (!error) {
      await fetchClasses();
      setIsAddOpen(false);
      setClassName("");
    } else {
      alert("Gagal menambah kelas: " + error.message);
    }

    setSaving(false);
  }

  async function handleEdit() {
    if (!className.trim() || !selectedClass) {
      alert("Nama kelas tidak boleh kosong!");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("classes")
      .update({ name: className.trim().toUpperCase() })
      .eq("id", selectedClass.id);

    if (!error) {
      await fetchClasses();
      setIsEditOpen(false);
      setClassName("");
      setSelectedClass(null);
    } else {
      alert("Gagal mengedit kelas: " + error.message);
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedClass) return;

    setSaving(true);

    try {
      // 1. Hapus semua tokens yang terkait dengan kelas ini
      const { error: tokensError } = await supabase
        .from("tokens")
        .delete()
        .eq("class_id", selectedClass.id);

      if (tokensError) {
        console.error("Error menghapus tokens:", tokensError);
        throw tokensError;
      }

      // 2. Baru hapus kelas
      const { error: classError } = await supabase
        .from("classes")
        .delete()
        .eq("id", selectedClass.id);

      if (classError) throw classError;

      await fetchClasses();
      setIsDeleteOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      alert("Gagal menghapus kelas: " + err.message);
    }

    setSaving(false);
  }

  const openEdit = (cls: ClassData) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setIsEditOpen(true);
  };

  const openDelete = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <BookOpen className="w-7 h-7 text-blue-600" />
            Manajemen Kelas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola master data kelas untuk pengelompokan pemilih.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Kelas
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama kelas..."
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
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Nama Kelas
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Tingkat
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Status Pemilih
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">
                    Tanggal Terdaftar
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-sm">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      Tidak ada data kelas
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => (
                    <tr
                      key={cls.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200">
                          {cls.name}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {detectLevel(cls.name)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-slate-900">
                            {cls.token_count || 0}
                          </span>
                          <span className="text-slate-500">PIN dibuat</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {formatDate(cls.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(cls)}
                            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(cls)}
                            className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Total */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Total: {filteredClasses.length} ruang kelas terdaftar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tambah Kelas */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kelas Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama kelas yang akan ditambahkan ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Nama Kelas
              </label>
              <Input
                placeholder="Contoh: X PPLG 1"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <p className="text-xs text-slate-500">
                Tingkat akan terdeteksi otomatis (X = Kelas 10, XI = Kelas 11, XII = Kelas 12)
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setClassName("");
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving || !className.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Kelas */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>
              Ubah nama kelas yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Nama Kelas
              </label>
              <Input
                placeholder="Contoh: X PPLG 1"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setClassName("");
                  setSelectedClass(null);
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleEdit}
                disabled={saving || !className.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedClass && (selectedClass.token_count || 0) > 0
                ? `Kelas "${selectedClass?.name}" memiliki ${(selectedClass.token_count || 0)} token. Semua token akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`
                : `Apakah Anda yakin ingin menghapus kelas "${selectedClass?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClass(null)}>
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