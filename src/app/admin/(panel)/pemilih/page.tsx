"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Search,
  CheckCircle2,
  Circle,
  Plus,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";

interface ClassData {
  id: number;
  name: string;
}

interface Token {
  id: number;
  pin: string;
  class_id: number;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
}

interface ClassStats {
  class_id: number;
  class_name: string;
  total: number;
  unused: number;
  used: number;
}

export default function PemilihPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [pinCount, setPinCount] = useState("");
  const [previewTokens, setPreviewTokens] = useState<Token[]>([]);
  const [previewClassName, setPreviewClassName] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .order("name");

    if (!classError && classData) {
      setClasses(classData);
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .order("created_at", { ascending: true });

    if (!tokenError && tokenData) {
      setTokens(tokenData);
    }

    setLoading(false);
  }

  function generateRandomPin(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function handleGenerate() {
    if (!selectedClass || !pinCount) {
      alert("Pilih kelas dan masukkan jumlah PIN terlebih dahulu!");
      return;
    }

    setGenerating(true);
    const count = parseInt(pinCount);
    const tokensToInsert: Array<{ pin: string; class_id: number; is_used: boolean }> = [];
    const existingPins = tokens.map(t => t.pin);

    for (let i = 0; i < count; i++) {
      let pin = generateRandomPin();
      while (existingPins.includes(pin) || tokensToInsert.some(t => t.pin === pin)) {
        pin = generateRandomPin();
      }
      tokensToInsert.push({
        pin,
        class_id: selectedClass,
        is_used: false,
      });
    }

    const { error } = await supabase.from("tokens").insert(tokensToInsert);

    if (!error) {
      await fetchData();
      setIsGenerateOpen(false);
      setPinCount("");
      setSelectedClass(null);

      const { data: freshTokens } = await supabase
        .from("tokens")
        .select("*")
        .eq("class_id", selectedClass)
        .order("created_at", { ascending: true });

      if (freshTokens) {
        setPreviewTokens(freshTokens);
        const className = classes.find(c => c.id === selectedClass)?.name || "";
        setPreviewClassName(className);
        setIsPreviewOpen(true);
      }
    } else {
      alert("Gagal generate PIN: " + error.message);
    }

    setGenerating(false);
  }

  async function handleViewPins(classId: number) {
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setPreviewTokens(data);
      const className = classes.find(c => c.id === classId)?.name || "";
      setPreviewClassName(className);
      setIsPreviewOpen(true);
    }
  }

  function exportToPDF() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("KREDENSIAL PEMILIHAN OSIS", pageWidth / 2, y, { align: "center" });
    y += 8;

    // Subheader
    doc.setFontSize(13);
    doc.text(`Kelas ${previewClassName}`, pageWidth / 2, y, { align: "center" });
    y += 6;

    // Warning
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "PENTING: Dokumen bersifat RAHASIA. Potong dan bagikan setiap kotak PIN kepada siswa. Setiap PIN berlaku 1 kali.",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 4;

    // Garis pemisah
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Grid
    const cols = 4;
    const colWidth = (pageWidth - 2 * margin) / cols;
    const rowHeight = 25;
    let startY = y;

    previewTokens.forEach((token, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = margin + col * colWidth;
      const yPos = startY + row * rowHeight;

      if (yPos + rowHeight > 280) {
        doc.addPage();
        startY = 15;
        const newYPos = startY + row * rowHeight;

        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.rect(x + 1, newYPos, colWidth - 2, rowHeight - 2);
        doc.setLineDashPattern([], 0);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`SISWA ${idx + 1}`, x + colWidth / 2, newYPos + 6, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(token.pin, x + colWidth / 2, newYPos + 17, { align: "center" });
      } else {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.rect(x + 1, yPos, colWidth - 2, rowHeight - 2);
        doc.setLineDashPattern([], 0);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`SISWA ${idx + 1}`, x + colWidth / 2, yPos + 6, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(token.pin, x + colWidth / 2, yPos + 17, { align: "center" });
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "OSIS Voting System - SMK Budi Bakti Ciwidey",
        pageWidth / 2,
        285,
        { align: "center" }
      );
    }

    const fileName = `Kredensial_${previewClassName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  }

  function getClassStats(): ClassStats[] {
    return classes.map(cls => {
      const classTokens = tokens.filter(t => t.class_id === cls.id);
      return {
        class_id: cls.id,
        class_name: cls.name,
        total: classTokens.length,
        unused: classTokens.filter(t => !t.is_used).length,
        used: classTokens.filter(t => t.is_used).length,
      };
    });
  }

  const filteredStats = getClassStats().filter(s =>
    s.class_name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Key className="w-7 h-7 text-blue-600" />
            Manajemen Kredensial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hasilkan dan kelola PIN rahasia untuk otorisasi pemilih.
          </p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Generate PIN
        </Button>
      </div>

      {/* Search & Table */}
      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Kelas</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Total Kredensial</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Belum Digunakan</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Sudah Memilih</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      Tidak ada data kelas
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((stat) => (
                    <tr key={stat.class_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm">
                          {stat.class_name}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        {stat.total}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500">
                        {stat.unused}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-green-600">
                        {stat.used}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPins(stat.class_id)}
                          disabled={stat.total === 0}
                        >
                          Lihat PIN
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Generate PIN */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat PIN Pemilih</DialogTitle>
            <DialogDescription>
              Pilih kelas dan tentukan jumlah PIN yang dibutuhkan sesuai dengan jumlah siswa di kelas tersebut.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Target Kelas
              </label>
              <Select
                value={selectedClass?.toString()}
                onValueChange={(val) => setSelectedClass(parseInt(val))}
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Jumlah PIN
              </label>
              <Input
                type="number"
                placeholder="Contoh: 36"
                value={pinCount}
                onChange={(e) => setPinCount(e.target.value)}
                min={1}
                max={100}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedClass || !pinCount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? "Menghasilkan..." : "Hasilkan PIN"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preview PIN */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent 
          className="w-[95vw] max-w-[1280px] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
          style={{
            width: "95vw",
            maxWidth: "1280px",
            height: "90vh",
            maxHeight: "90vh"
          }}
        >
          <DialogHeader className="border-b border-slate-200 pb-5 px-8 pt-6 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  Kredensial Kelas {previewClassName}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-slate-500">
                  Pratinjau Kredensial. Gunakan tombol cetak di bawah untuk mendapatkan dokumen siap potong.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {previewTokens.map((token, idx) => (
                <div
                  key={token.id}
                  className={`border-2 rounded-2xl p-6 text-center transition-all min-h-[160px] flex flex-col justify-center ${
                    token.is_used
                      ? "border-slate-200 bg-slate-50 opacity-50"
                      : "border-blue-300 bg-gradient-to-br from-blue-50 to-white hover:border-blue-500 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-sm font-semibold text-slate-600">
                      Siswa {idx + 1}
                    </span>
                    <div className="ml-2">
                      {token.is_used ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className={`text-2xl font-black font-mono tracking-widest ${
                    token.is_used ? "text-slate-400 line-through" : "text-blue-700"
                  }`}>
                    {token.pin}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 pb-6 px-8 flex justify-end shrink-0 bg-slate-50">
            <Button
              onClick={exportToPDF}
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 px-8"
            >
              <Download className="mr-2 h-5 w-5" />
              Cetak Dokumen A4
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}