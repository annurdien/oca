import React, { useState, useMemo } from 'react';
import { Holiday, HolidayType } from '../types';
import { X, Target, Briefcase, Sparkles, ChevronLeft, ChevronRight } from './Icons';
import { playClick, playHover } from '../services/audioEngine';

interface LeavePlannerModalProps {
    year: number;
    holidays: Record<string, Holiday[]>;
    onClose: () => void;
    onYearChange?: (year: number) => void;
}

interface Recommendation {
    leaveStartDate: Date;
    leaveEndDate: Date;
    vacationStartDate: Date;
    vacationEndDate: Date;
    cost: number; // Days of leave needed
    reward: number; // Total consecutive days off
    efficiency: number; // Reward / Cost
    reason: string;
    description: string;
}

const LeavePlannerModal: React.FC<LeavePlannerModalProps> = ({ year, holidays, onClose, onYearChange }) => {
    const [companyObservesCuti, setCompanyObservesCuti] = useState(true);
    const [maxLeaveSpend, setMaxLeaveSpend] = useState(2); // Max days I'm willing to burn at once
    const [minTotalDaysOff, setMinTotalDaysOff] = useState(4); // Minimum reward to consider
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    // --- Core Logic ---
    const recommendations = useMemo(() => {
        const recs: Recommendation[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        // 1. Map the entire year into a timeline
        const timeline: { date: Date; isOff: boolean; note?: string }[] = [];
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        // Helper to format date key
        const getKey = (d: Date) => {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            const key = getKey(currentDate);
            const dayHols = holidays[key] || [];
            const dayOfWeek = currentDate.getDay();

            let isOff = false;
            let note = '';

            // Check Weekend
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                isOff = true;
                note = 'Weekend';
            }

            // Check Holidays
            const nationalHol = dayHols.find(h => h.type === HolidayType.NATIONAL);
            const cutiHol = dayHols.find(h => h.type === HolidayType.CUTI_BERSAMA);

            if (nationalHol) {
                isOff = true;
                note = nationalHol.name;
            } else if (cutiHol) {
                // Critical Logic: Does company observe Cuti?
                if (companyObservesCuti) {
                    isOff = true;
                    note = cutiHol.name;
                } else {
                    // It's a work day, but marked as Cuti Bersama potential
                    note = `(Cuti: ${cutiHol.name})`;
                }
            }

            timeline.push({ date: currentDate, isOff, note });
        }

        // 2. Find Gaps (Work days sandwiched between Off days)
        let i = 0;
        while (i < timeline.length) {
            // Find an "Off" cluster
            if (timeline[i].isOff) {
                i++;
                continue;
            }

            // We are at a Work day. Let's see how long this work span is.
            let workSpanStart = i;
            let workDays = 0;

            while (i < timeline.length && !timeline[i].isOff) {
                workDays++;
                i++;
            }
            // Now i is at the next Off day (or end of year)

            // Check if this work span is bridgeable based on user setting
            if (workDays > 0 && workDays <= maxLeaveSpend) {
                // It's a potential bridge!

                // Calculate "Previous Off Cluster" size (backwards from workSpanStart - 1)
                let prevOffStart = workSpanStart - 1;
                while (prevOffStart >= 0 && timeline[prevOffStart].isOff) {
                    prevOffStart--;
                }
                const prevOffClusterStart = prevOffStart + 1;
                const prevOffDays = (workSpanStart - 1) - prevOffStart;

                // Calculate "Next Off Cluster" size (from i onwards)
                let nextOffEnd = i;
                while (nextOffEnd < timeline.length && timeline[nextOffEnd].isOff) {
                    nextOffEnd++;
                }
                const nextOffClusterEnd = nextOffEnd - 1;
                const nextOffDays = nextOffEnd - i;

                // Calculate Total Reward (Prev Off + Bridge + Next Off)
                const totalOff = prevOffDays + workDays + nextOffDays;

                // Only recommend if it significantly boosts time off
                if (totalOff >= minTotalDaysOff) {
                    const leaveStartDate = timeline[workSpanStart].date;
                    const leaveEndDate = timeline[i - 1].date;

                    // FILTER: Future dates only
                    if (leaveStartDate >= today) {
                        // FILTER: Selected Month (if not all)
                        // We check if the leave starts in the selected month
                        if (selectedMonth === 'all' || leaveStartDate.getMonth() === selectedMonth) {

                            const vacationStartDate = timeline[prevOffClusterStart].date;
                            const vacationEndDate = timeline[nextOffClusterEnd].date;

                            const prevNote = timeline[workSpanStart - 1]?.note || 'Weekend';
                            const nextNote = timeline[i]?.note || 'Weekend';

                            recs.push({
                                leaveStartDate,
                                leaveEndDate,
                                vacationStartDate,
                                vacationEndDate,
                                cost: workDays,
                                reward: totalOff,
                                efficiency: parseFloat((totalOff / workDays).toFixed(1)),
                                reason: `Bridge ${workDays} day(s)`,
                                description: `Connects ${prevNote.substring(0, 15)}... with ${nextNote.substring(0, 15)}...`
                            });
                        }
                    }
                }
            }

            i++; // Continue scanning
        }

        return recs.sort((a, b) => b.efficiency - a.efficiency || b.reward - a.reward);
    }, [year, holidays, companyObservesCuti, maxLeaveSpend, minTotalDaysOff, selectedMonth]);


    const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const formatFullDate = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-5xl h-[85vh] bg-[#050914] border border-neonBlue/30 shadow-[0_0_50px_rgba(0,243,255,0.1)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonBlue via-neonPurple to-neonBlue animate-pulse"></div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neonBlue/10 border border-neonBlue flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-neonBlue/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            <Briefcase className="w-6 h-6 text-neonBlue relative z-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white font-mono tracking-tight">TACTICAL LEAVE OPTIMIZER</h2>
                            <p className="text-xs text-slate-400 font-mono tracking-widest">FUTURE GAP ANALYSIS // V2.0</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        onMouseEnter={playHover}
                        className="w-10 h-10 flex items-center justify-center hover:bg-neonRed hover:text-black text-slate-400 border border-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Controls Area */}
                <div className="flex flex-col gap-4 p-6 border-b border-white/5 bg-white/[0.02]">

                    {/* Top Row: Year & Month Selection */}
                    <div className="flex flex-col md:flex-row gap-6 border-b border-dashed border-white/10 pb-4 mb-2">
                        {/* Year Selector */}
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-mono text-neonBlue tracking-widest uppercase">TARGET YEAR</label>
                            <div className="flex items-center bg-black border border-white/20 p-1">
                                <button
                                    onClick={() => { playClick(); onYearChange && onYearChange(year - 1); }}
                                    onMouseEnter={playHover}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 font-mono font-bold text-white">{year}</span>
                                <button
                                    onClick={() => { playClick(); onYearChange && onYearChange(year + 1); }}
                                    onMouseEnter={playHover}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="flex items-center gap-4 flex-1">
                            <label className="text-[10px] font-mono text-neonBlue tracking-widest uppercase whitespace-nowrap">FILTER MONTH</label>
                            <div className="flex-1 overflow-x-auto custom-scrollbar pb-1">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { playClick(); setSelectedMonth('all'); }}
                                        onMouseEnter={playHover}
                                        className={`px-3 py-1 text-xs font-mono border transition-colors whitespace-nowrap ${selectedMonth === 'all' ? 'bg-neonBlue text-black border-neonBlue font-bold' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'}`}
                                    >
                                        ALL
                                    </button>
                                    {months.map((m, idx) => (
                                        <button
                                            key={m}
                                            onClick={() => { playClick(); setSelectedMonth(idx); }}
                                            onMouseEnter={playHover}
                                            className={`px-3 py-1 text-xs font-mono border transition-colors whitespace-nowrap ${selectedMonth === idx ? 'bg-neonBlue text-black border-neonBlue font-bold' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'}`}
                                        >
                                            {m.toUpperCase().slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Settings */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Toggle Cuti Bersama */}
                        <div className="flex-1 md:border-r border-white/5 md:pr-6">
                            <div
                                className="flex items-center gap-3 cursor-pointer group select-none"
                                onClick={() => { playClick(); setCompanyObservesCuti(!companyObservesCuti); }}
                                onMouseEnter={playHover}
                            >
                                <div className={`w-10 h-5 rounded-full border transition-colors relative ${companyObservesCuti ? 'bg-neonBlue/20 border-neonBlue' : 'bg-slate-800 border-slate-600'}`}>
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${companyObservesCuti ? 'bg-neonBlue left-5 shadow-[0_0_10px_#00f3ff]' : 'bg-slate-500 left-1'}`}></div>
                                </div>
                                <span className={`text-xs font-mono ${companyObservesCuti ? 'text-white' : 'text-slate-500'}`}>
                                    PROTOCOL: {companyObservesCuti ? "CUTI IS HOLIDAY" : "CUTI IS WORKDAY"}
                                </span>
                            </div>
                        </div>

                        {/* Max Leave Slider */}
                        <div className="flex-1 flex items-center gap-4">
                            <label className="text-[10px] font-mono text-slate-400 tracking-wider uppercase whitespace-nowrap">
                                MAX LEAVE COST:
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="1"
                                value={maxLeaveSpend}
                                onChange={(e) => setMaxLeaveSpend(parseInt(e.target.value))}
                                onMouseEnter={playHover}
                                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neonBlue hover:accent-neonBlue/80"
                            />
                            <span className="text-neonBlue font-bold font-mono text-sm">{maxLeaveSpend} DAYS</span>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-dashed border-white/10">
                        {/* Min Total Off Slider */}
                        <div className="flex-1 flex items-center gap-4">
                            <label className="text-[10px] font-mono text-slate-400 tracking-wider uppercase whitespace-nowrap">
                                MIN TOTAL OFF:
                            </label>
                            <input
                                type="range"
                                min="3"
                                max="14"
                                step="1"
                                value={minTotalDaysOff}
                                onChange={(e) => setMinTotalDaysOff(parseInt(e.target.value))}
                                onMouseEnter={playHover}
                                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neonGreen hover:accent-neonGreen/80"
                            />
                            <span className="text-neonGreen font-bold font-mono text-sm">{minTotalDaysOff} DAYS</span>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 p-6">
                    {recommendations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <Target className="w-16 h-16 mb-4 text-slate-700" />
                            <p className="font-mono text-lg">NO FUTURE OPPORTUNITIES FOUND</p>
                            <p className="text-xs font-mono mt-2">TRY ADJUSTING MONTH FILTER OR PARAMETERS</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recommendations.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className="bg-deepSpace border border-white/10 hover:border-neonBlue/50 hover:bg-white/[0.02] transition-all group relative overflow-hidden flex flex-col md:flex-row"
                                >
                                    {/* Left Strip - Efficiency */}
                                    <div className="w-full md:w-2 bg-gradient-to-b from-neonBlue to-transparent md:h-auto h-1"></div>

                                    {/* Action Section (Take Leave) */}
                                    <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 text-neonRed mb-2">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">ACTION REQUIRED</span>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-xs text-slate-500 font-mono uppercase mb-1">Request Leave For:</p>
                                            <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                                                <span>{formatDate(rec.leaveStartDate)}</span>
                                                {rec.cost > 1 && (
                                                    <>
                                                        <span className="text-slate-600">-</span>
                                                        <span>{formatDate(rec.leaveEndDate)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-neonRed font-mono uppercase bg-neonRed/10 px-2 py-1 border border-neonRed/20">
                                                COST: {rec.cost} DAYS
                                            </span>
                                        </div>
                                    </div>

                                    {/* Outcome Section (Vacation) */}
                                    <div className="p-5 flex-[1.5]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-neonGreen">
                                                <Sparkles className="w-4 h-4" />
                                                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">PROJECTED OUTCOME</span>
                                            </div>

                                            <div className="text-[10px] font-mono text-slate-400">
                                                EFFICIENCY: <span className="text-white font-bold">{rec.efficiency}x</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 font-mono uppercase mb-1">Total Vacation Period:</p>
                                                <div className="text-xl text-white font-mono font-bold">
                                                    {formatFullDate(rec.vacationStartDate)} <span className="text-slate-600 mx-1">→</span> {formatFullDate(rec.vacationEndDate)}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 font-mono">
                                                    {rec.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-dashed border-white/10 flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {Array.from({ length: Math.min(12, rec.reward) }).map((_, i) => (
                                                    <div key={i} className={`w-1.5 h-3 rounded-[1px] ${i < rec.reward ? 'bg-neonGreen' : 'bg-slate-800'}`}></div>
                                                ))}
                                                {rec.reward > 12 && <span className="text-neonGreen text-xs">+</span>}
                                            </div>
                                            <span className="text-lg font-bold text-neonGreen font-mono leading-none">
                                                {rec.reward} <span className="text-[10px] text-slate-500">DAYS OFF</span>
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-black/60 border-t border-white/10 text-right flex justify-between items-center">
                    <div className="flex gap-4 text-[9px] font-mono text-slate-600">
                        <span>MODE: FUTURE_ONLY</span>
                        <span>YEAR: {year}</span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-500">AI-ASSISTED OPTIMIZATION ENGINE // V2.1</p>
                </div>

            </div>
        </div>
    );
};

export default LeavePlannerModal;