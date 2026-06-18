"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, ReactNode } from "react";
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
  Clock,
  TrendingUp,
  Sparkles,
  Zap
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-white/80 backdrop-blur-xl shadow-2xl flex items-center justify-center border border-white/50">
              <Activity className="w-12 h-12 text-purple-600 animate-bounce" />
            </div>
          </div>
          <p className="mt-8 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-wide">Menyinkronkan data...</p>
          <div className="mt-6 flex gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce shadow-lg"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chartColors = [
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-violet-500 to-purple-500"
  ];
  
  const chartSolidColors = ["#a855f7", "#06b6d4", "#10b981", "#f97316", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 font-sans antialiased relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
              </span>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Live Monitoring</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              Pusat Kendali
            </h1>
            <p className="text-lg text-slate-600 font-medium">Pemantauan hasil pemilihan OSIS secara real-time</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-5 py-3 bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg rounded-2xl text-sm text-slate-700 font-bold">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="font-mono">{timeString}</span>
            </div>
            <button
              onClick={fetchMetrics}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-purple-500/30 disabled:opacity-70 active:scale-95"
            >
              <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>
          </div>
        </header>

        {/* Primary Metrics - Glassmorphism Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {/* Partisipasi Card - Featured Large */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl flex flex-col justify-between p-8 rounded-3xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Partisipasi</span>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <p className="text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">{stats?.participationRate}</p>
                <span className="text-2xl font-bold text-purple-600">%</span>
              </div>
            </div>
            <div className="mt-8 w-full bg-white/60 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/80">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-purple-500/50"
                style={{ width: `${stats?.participationRate}%` }}
              />
            </div>
          </div>

          <StatCard icon={<CheckCircle2 className="w-6 h-6 text-white" />} gradient="from-emerald-500 to-teal-500" shadowColor="shadow-emerald-500/30" value={stats?.usedTokens} label="Suara Sah" />
          <StatCard icon={<KeyRound className="w-6 h-6 text-white" />} gradient="from-orange-500 to-red-500" shadowColor="shadow-orange-500/30" value={stats?.totalTokens} label="Total Pemilih" />
          <StatCard icon={<Users className="w-6 h-6 text-white" />} gradient="from-cyan-500 to-blue-500" shadowColor="shadow-cyan-500/30" value={stats?.totalCandidates} label="Paslon" />
          <StatCard icon={<School className="w-6 h-6 text-white" />} gradient="from-violet-500 to-purple-500" shadowColor="shadow-violet-500/30" value={stats?.totalClasses} label="Daftar Kelas" />
        </section>

        {/* Main Analytics Area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart Section */}
          <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-10"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200">
                    <BarChart4 className="w-6 h-6 text-purple-600" />
                  </div>
                  Perolehan Suara
                </h3>
                <p className="text-sm text-slate-600 mt-3 ml-16 font-medium">Distribusi suara masuk berdasarkan nomor urut paslon</p>
              </div>
            </div>

            <div className="relative z-10 h-80 w-full mt-4 flex items-end justify-around gap-6 sm:gap-10 pb-6">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-dashed border-slate-200/60 w-full h-0" />
                ))}
              </div>

              {stats?.votesByCandidate.map((candidate, idx) => {
                const maxVoteCount = Math.max(...(stats.votesByCandidate.map(c => c.vote_count)), 10);
                const barHeight = (candidate.vote_count / maxVoteCount) * 100;
                
                const isWinner = leader && leader.id === candidate.id && candidate.vote_count > 0;
                const colorClass = isWinner ? "from-yellow-400 via-orange-500 to-red-500" : chartColors[idx % chartColors.length];

                return (
                  <div key={candidate.id} className="flex flex-col items-center justify-end w-full max-w-[110px] h-full group z-10">
                    <div className="mb-4 text-center transition-transform group-hover:-translate-y-3 duration-300">
                      <span className={`block font-black ${isWinner ? 'bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent text-3xl' : 'text-slate-700 text-2xl'}`}>
                        {candidate.vote_count}
                      </span>
                      {isWinner && (
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span className="text-[10px] font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">Leader</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full relative flex justify-center items-end h-[260px]">
                      <div
                        className={`w-full sm:w-24 rounded-t-3xl transition-all duration-1000 ease-out relative overflow-hidden bg-gradient-to-t ${colorClass} ${isWinner ? 'shadow-2xl shadow-yellow-500/50' : 'shadow-xl shadow-slate-900/10'}`}
                        style={{ 
                          height: `${Math.max(barHeight, 2)}%`, 
                          opacity: candidate.vote_count === 0 ? 0.1 : 1
                        }}
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30"></div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-base font-black mb-3 border-2 transition-all ${isWinner ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 text-white shadow-xl shadow-yellow-500/50' : 'bg-white/80 backdrop-blur-xl border-white/90 text-slate-700 shadow-lg'}`}>
                        {candidate.order_number}
                      </div>
                      <p className="text-xs font-bold text-slate-600 truncate w-28 px-1" title={candidate.chairman_name}>
                        {candidate.chairman_name.split(' ')[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            
            {/* Current Leader Alert */}
            {leader && leader.vote_count > 0 && (
              <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 blur-3xl rounded-full group-hover:bg-white/30 transition-colors"></div>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Trophy className="w-48 h-48" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xl shadow-xl">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">Unggul Sementara</span>
                  </div>
                  <h4 className="text-3xl font-black mb-2 tracking-tight">{leader.chairman_name}</h4>
                  <p className="text-white/80 text-sm mb-8 font-bold">Paslon {leader.order_number}</p>
                  
                  <div className="flex items-end justify-between pt-8 border-t border-white/20">
                    <div>
                      <p className="text-5xl font-black text-white">{leader.percentage}<span className="text-2xl text-white/70 font-bold">%</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Perolehan</p>
                      <p className="text-2xl font-black text-white">{leader.vote_count} Suara</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Composition */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8">
              <h3 className="text-sm font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"></div>
                Proporsi Suara
              </h3>
              <div className="space-y-7">
                {stats?.votesByCandidate.map((candidate, idx) => (
                  <div key={candidate.id} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg" 
                          style={{ backgroundColor: chartSolidColors[idx % chartSolidColors.length], boxShadow: `0 0 12px ${chartSolidColors[idx % chartSolidColors.length]}60` }} 
                        />
                        <span className="text-sm font-black text-slate-700">Paslon {candidate.order_number}</span>
                      </div>
                      <span className="text-base font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{candidate.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-3.5 overflow-hidden backdrop-blur-sm border border-white/80">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ 
                          width: `${candidate.percentage}%`, 
                          backgroundColor: chartSolidColors[idx % chartSolidColors.length]
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
          <section className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-10"></div>
            
            <div className="relative z-10 p-8 border-b border-white/60 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200">
                  <LayoutGrid className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Partisipasi Per Kelas</h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">Tingkat keaktifan pemilih dari setiap kelas</p>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.votesByClass.map((cls, idx) => {
                const isTop3 = idx < 3;
                const medalColors = [
                  "from-yellow-400 to-orange-500",
                  "from-slate-300 to-slate-400",
                  "from-orange-400 to-red-500"
                ];
                
                return (
                  <div key={cls.class_name} className={`flex flex-col p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-2 ${isTop3 ? 'bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-xl border-white/80 shadow-xl' : 'bg-white/40 backdrop-blur-xl border-white/60 hover:bg-white/60 hover:shadow-lg'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        {isTop3 ? (
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${medalColors[idx]} flex items-center justify-center text-white font-black text-xl shadow-xl`}>
                            {idx + 1}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 flex items-center justify-center text-base font-black text-slate-600">
                            {idx + 1}
                          </div>
                        )}
                        <span className="font-black text-slate-900 text-xl">{cls.class_name}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Total Suara</span>
                        <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{cls.total_votes}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mb-2.5">
                        <span className="font-bold">Partisipasi</span>
                        <span className="font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{cls.participation_rate}%</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/80">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-purple-500/30"
                          style={{ width: `${cls.participation_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

// Helper component for Stat Cards
function StatCard({ icon, gradient, shadowColor, value, label }: { icon: ReactNode, gradient: string, shadowColor: string, value: number | undefined, label: string }) {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl flex flex-col justify-between p-6 rounded-3xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadowColor}`}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">{value}</p>
          <p className="text-[10px] font-black text-slate-600 mt-3 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    </div>
  );
}