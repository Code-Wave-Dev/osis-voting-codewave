"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  KeyRound,
  School,
  RefreshCcw,
  CheckCircle2,
  Trophy,
  Activity,
  BarChart4,
  LayoutGrid,
  Clock
} from "lucide-react";

interface CandidateVote {
  id: string;
  order_number: string;
  chairman_name: string;
  vote_count: number;
  percentage: number;
}

interface ClassVote {
  class_name: string;
  total_votes: number;
  participation_rate: number;
}

interface DashboardStats {
  totalCandidates: number;
  totalTokens: number;
  usedTokens: number;
  totalClasses: number;
  participationRate: number;
  votesByCandidate: CandidateVote[];
  votesByClass: ClassVote[];
}

export default function RealtimeDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    setIsSyncing(true);

    try {
      const [
        { count: candidatesCount },
        { count: tokensCount },
        { count: usedTokensCount },
        { count: classesCount },
        { data: candidatesData },
        { data: classesData },
      ] = await Promise.all([
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("tokens").select("*", { count: "exact", head: true }),
        supabase.from("tokens").select("*", { count: "exact", head: true }).eq("is_used", true),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("candidates").select("id, order_number, chairman_name").order("order_number"),
        supabase.from("classes").select("id, name"),
      ]);

      const safeTotalTokens = tokensCount || 0;
      const safeUsedTokens = usedTokensCount || 0;
      const globalParticipation = safeTotalTokens > 0 
        ? (safeUsedTokens / safeTotalTokens) * 100 
        : 0;

      const { data: allVotes } = await supabase.from("votes").select("candidate_id");
      const { data: usedTokensData } = await supabase.from("tokens").select("class_id").eq("is_used", true);

      const voteCountMap = (allVotes || []).reduce((acc: Record<string, number>, vote) => {
        acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
        return acc;
      }, {});

      // Urutan Paslon dikunci berdasarkan nomor urut bawaan (tidak di-sort berdasarkan suara)
      const processedCandidates = (candidatesData || []).map((c) => {
        const count = voteCountMap[c.id] || 0;
        const percentage = safeUsedTokens > 0 ? (count / safeUsedTokens) * 100 : 0;
        
        return {
          id: c.id,
          order_number: c.order_number,
          chairman_name: c.chairman_name,
          vote_count: count,
          percentage: Number(percentage.toFixed(1)),
        };
      });

      const classVoteMap = (usedTokensData || []).reduce((acc: Record<string, number>, token) => {
        if (token.class_id) acc[token.class_id] = (acc[token.class_id] || 0) + 1;
        return acc;
      }, {});

      const avgTokensPerClass = (classesCount && safeTotalTokens) ? safeTotalTokens / classesCount : 0;

      const processedClasses = (classesData || []).map((cls) => {
        const votes = classVoteMap[cls.id] || 0;
        const rate = avgTokensPerClass > 0 ? (votes / avgTokensPerClass) * 100 : 0;
        return {
          class_name: cls.name,
          total_votes: votes,
          participation_rate: Number(Math.min(rate, 100).toFixed(1))
        };
      }).sort((a, b) => b.total_votes - a.total_votes);

      setStats({
        totalCandidates: candidatesCount || 0,
        totalTokens: safeTotalTokens,
        usedTokens: safeUsedTokens,
        totalClasses: classesCount || 0,
        participationRate: Number(globalParticipation.toFixed(1)),
        votesByCandidate: processedCandidates,
        votesByClass: processedClasses,
      });

      setLastSync(new Date());
    } catch (error) {
      console.error("Gagal menyinkronkan data dashboard:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const syncInterval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  // Mencari Paslon unggul secara dinamis tanpa mengubah urutan array utama
  const leader = useMemo(() => {
    if (!stats?.votesByCandidate || stats.votesByCandidate.length === 0) return null;
    return [...stats.votesByCandidate].sort((a, b) => b.vote_count - a.vote_count)[0];
  }, [stats?.votesByCandidate]);

  const timeString = useMemo(() => {
    return lastSync.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastSync]);

  if (!stats && isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-8 h-8 text-zinc-900 animate-pulse" />
        <p className="text-sm font-medium text-zinc-500">Menyinkronkan data...</p>
      </div>
    );
  }

  const chartColors = ["#18181b", "#52525b", "#a1a1aa", "#d4d4d8", "#f4f4f5"];

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8 bg-zinc-50 min-h-screen font-sans">
      
      {/* Top Navigation / Header Area */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Live Monitoring</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Pusat Komando</h1>
          <p className="text-sm text-zinc-500 font-medium">Pemantauan hasil pemilihan OSIS secara real-time</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 shadow-sm rounded-lg text-sm text-zinc-600 font-medium">
            <Clock className="w-4 h-4 text-zinc-400" />
            {timeString}
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-all shadow-sm disabled:opacity-70"
          >
            <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sinkronisasi</span>
          </button>
        </div>
      </header>

      {/* Primary Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Partisipasi Card */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-zinc-700" />
              </div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Partisipasi</span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-3xl font-bold text-zinc-900">{stats?.participationRate}</p>
              <span className="text-sm font-medium text-zinc-500">%</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-zinc-900 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${stats?.participationRate}%` }}
            />
          </div>
        </div>

        {/* Suara Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900">{stats?.usedTokens}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Suara Sah</p>
          </div>
        </div>

        {/* Total Pemilih */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900">{stats?.totalTokens}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Total Pemilih</p>
          </div>
        </div>

        {/* Kandidat */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900">{stats?.totalCandidates}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Paslon</p>
          </div>
        </div>

        {/* Kelas */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <School className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900">{stats?.totalClasses}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Daftar Kelas</p>
          </div>
        </div>

      </section>

      {/* Main Analytics Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <BarChart4 className="w-5 h-5 text-zinc-400" />
                Perolehan Suara
              </h3>
              <p className="text-sm text-zinc-500 mt-1">Distribusi suara masuk berdasarkan nomor urut paslon</p>
            </div>
          </div>

          <div className="relative h-72 w-full mt-4 flex items-end justify-around gap-2 sm:gap-6 border-b-2 border-zinc-100 pb-2">
            {stats?.votesByCandidate.map((candidate, idx) => {
              const maxVoteCount = Math.max(...(stats.votesByCandidate.map(c => c.vote_count)), 10);
              const barHeight = (candidate.vote_count / maxVoteCount) * 100;
              
              // Penentuan pemenang yang dinamis berdasarkan ID, bukan urutan posisi diagram
              const isWinner = leader && leader.id === candidate.id && candidate.vote_count > 0;
              const color = chartColors[idx % chartColors.length];

              return (
                <div key={candidate.id} className="flex flex-col items-center justify-end w-full max-w-[80px] h-full group">
                  <div className="mb-2 text-center transition-transform group-hover:-translate-y-1">
                    <span className={`block font-bold ${isWinner ? 'text-zinc-900 text-lg' : 'text-zinc-500 text-sm'}`}>
                      {candidate.vote_count}
                    </span>
                    {isWinner && <Trophy className="w-4 h-4 mx-auto text-yellow-500 mt-1" />}
                  </div>

                  <div className="w-full relative flex justify-center items-end h-[200px]">
                    <div
                      className="w-full sm:w-16 rounded-t-lg transition-all duration-700 ease-in-out relative overflow-hidden"
                      style={{ 
                        height: `${Math.max(barHeight, 2)}%`, 
                        backgroundColor: color,
                        opacity: candidate.vote_count === 0 ? 0.2 : 1
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 hover:bg-transparent transition-colors" />
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <div className="w-8 h-8 mx-auto bg-zinc-50 rounded-full flex items-center justify-center text-sm font-bold text-zinc-800 mb-1 border border-zinc-200">
                      {candidate.order_number}
                    </div>
                    <p className="text-xs font-semibold text-zinc-600 truncate w-20 px-1" title={candidate.chairman_name}>
                      {candidate.chairman_name.split(' ')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Analytics (Donut & Leader) */}
        <div className="space-y-6">
          
          {/* Current Leader Alert */}
          {leader && leader.vote_count > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Unggul Sementara</span>
              </div>
              <h4 className="text-xl font-extrabold text-zinc-900 mb-1">{leader.chairman_name}</h4>
              <p className="text-zinc-500 text-sm mb-4">Paslon {leader.order_number}</p>
              
              <div className="flex items-end justify-between pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-3xl font-black text-zinc-900">{leader.percentage}<span className="text-lg text-zinc-400 font-medium">%</span></p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Perolehan</p>
                  <p className="text-base font-bold text-zinc-700">{leader.vote_count} Suara</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Composition */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 mb-5 uppercase tracking-wide">Proporsi Suara</h3>
            <div className="space-y-4">
              {stats?.votesByCandidate.map((candidate, idx) => (
                <div key={candidate.id} className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: chartColors[idx % chartColors.length] }} 
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-zinc-700">Paslon {candidate.order_number}</span>
                      <span className="text-sm font-bold text-zinc-900">{candidate.percentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${candidate.percentage}%`, 
                          backgroundColor: chartColors[idx % chartColors.length] 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Class Leaderboard */}
      {stats?.votesByClass && stats.votesByClass.length > 0 && (
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Partisipasi Per Kelas</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.votesByClass.map((cls) => (
              <div key={cls.class_name} className="flex flex-col p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold text-zinc-800">{cls.class_name}</span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-zinc-200 text-zinc-700 shadow-sm">
                    {cls.total_votes} Suara
                  </span>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                    <span className="font-medium">Tingkat Partisipasi</span>
                    <span className="font-bold text-zinc-700">{cls.participation_rate}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-1.5">
                    <div
                      className="bg-zinc-800 h-full rounded-full transition-all duration-700"
                      style={{ width: `${cls.participation_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}