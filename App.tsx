
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Background from './components/Background';
import { fetchIndonesianHolidays } from './services/apiService';
import { Holiday, HolidayType } from './types';
import { ChevronLeft, ChevronRight, ListIcon, Briefcase, Volume2, VolumeX } from './components/Icons';
import HolidayDetail from './components/HolidayDetail';
import Cursor from './components/Cursor';
import YearViewModal from './components/YearViewModal';
import LeavePlannerModal from './components/LeavePlannerModal';
import { initAudio, playClick, playHover, playScan, toggleMute, getMuteState, startMusic } from './services/audioEngine';

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Record<string, Holiday[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadedYears, setLoadedYears] = useState<Set<number>>(new Set());
  const [showYearView, setShowYearView] = useState(false);
  const [showLeavePlanner, setShowLeavePlanner] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteState());
  
  // Year Picker State
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler for Year Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setIsYearPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Year Range for Selector
  const yearRange = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const start = currentYear - 2;
      const end = currentYear + 5;
      const years = [];
      for (let y = start; y <= end; y++) years.push(y);
      return years;
  }, []);

  useEffect(() => {
    const loadHolidays = async () => {
      if (loadedYears.has(year)) return;

      setLoading(true);
      try {
        const fetchedHolidays = await fetchIndonesianHolidays(year);
        setHolidays(prev => {
          const newHolidays = { ...prev };
          fetchedHolidays.forEach(h => {
            if (!newHolidays[h.date]) {
              newHolidays[h.date] = [];
            }
            // Avoid duplicates
            if (!newHolidays[h.date].some(ex => ex.name === h.name)) {
              newHolidays[h.date].push(h);
            }
          });
          return newHolidays;
        });
        setLoadedYears(prev => new Set(prev).add(year));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
  }, [year, loadedYears]);

  // Initialize Audio on first interaction
  const handleInteraction = () => {
    if (!isMuted) {
        initAudio();
        startMusic();
    }
  };

  // Helper to change month
  const changeMonth = (delta: number) => {
    playClick();
    setCurrentDate(new Date(year, month + delta, 1));
  };

  // Helper to change year
  const handleYearChange = (newYear: number) => {
      playClick();
      setCurrentDate(new Date(newYear, month, 1));
      setIsYearPickerOpen(false);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent double trigger with main div click
      const newState = toggleMute();
      setIsMuted(newState);
      if (!newState) {
          initAudio(); 
          playClick();
          // startMusic is handled inside toggleMute
      }
  };

  const handleOpenLeavePlanner = () => {
      playScan();
      setShowLeavePlanner(true);
  };

  const handleOpenYearView = () => {
      playScan();
      setShowYearView(true);
  };

  const handleSelectDate = (date: Date) => {
      playClick();
      setSelectedDate(date);
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday

    const days = [];

    // Previous month filler
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevMonthDays - i),
            isCurrentMonth: false
        });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: new Date(year, month, i),
            isCurrentMonth: true
        });
    }

    // Next month filler
    const totalSlots = 42; // 6 rows * 7 days
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false
        });
    }
    return days;
  }, [year, month]);

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getHolidaysForDate = (date: Date) => {
    const key = formatDateKey(date);
    return holidays[key] || [];
  };

  const isRedDate = (date: Date) => {
    const day = date.getDay();
    const hols = getHolidaysForDate(date);
    const hasNationalHoliday = hols.some(h => h.type === HolidayType.NATIONAL);
    return day === 0 || hasNationalHoliday;
  };

  const isCutiBersama = (date: Date) => {
    const hols = getHolidaysForDate(date);
    return hols.some(h => h.type === HolidayType.CUTI_BERSAMA);
  };

  return (
    <div 
        className="h-screen w-full font-sans flex flex-col relative overflow-hidden text-white bg-transparent selection:bg-neonBlue selection:text-black scanlines"
        onClick={handleInteraction} 
    >
      <Cursor />
      <Background />
      
      {/* Top Navigation Bar - Technical & Compact */}
      <header className="flex-shrink-0 h-16 md:h-20 bg-transparent flex items-center justify-between px-4 md:px-8 z-20 relative border-b border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative group">
             <div className="w-10 h-10 bg-black border border-neonBlue/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-neonBlue/10 animate-pulse-fast"></div>
                <span className="font-mono font-bold text-xl text-neonBlue z-10">OCA</span>
             </div>
             {/* Decorative connection line */}
             <div className="absolute -right-4 top-1/2 w-4 h-[1px] bg-neonBlue/30 hidden md:block"></div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm md:text-xl font-bold font-mono tracking-widest text-white uppercase animate-glitch">
              OVERENGINEERED
            </h1>
            <span className="text-[10px] text-neonBlue font-mono tracking-[0.3em] opacity-70 hidden md:block">CALENDAR APPLICATION V9.0</span>
          </div>
          
          {/* Year Selector - Compact for mobile */}
          <div className="ml-2 md:ml-8 relative" ref={yearPickerRef}>
              <button
                onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                    setIsYearPickerOpen(!isYearPickerOpen);
                }}
                onMouseEnter={playHover}
                className={`
                    flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/50 border backdrop-blur-md transition-all duration-300
                    ${isYearPickerOpen 
                        ? 'border-neonBlue text-neonBlue shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                        : 'border-white/10 text-slate-300 hover:border-neonBlue/50'}
                `}
              >
                <span className="font-mono font-bold text-sm md:text-base tracking-wider">{year}</span>
                <div className={`w-2 h-2 border-b border-r border-current transform transition-transform ${isYearPickerOpen ? 'rotate-[225deg] mt-1' : 'rotate-45 -mt-1'}`}></div>
              </button>

              {isYearPickerOpen && (
                <div className="absolute top-full left-0 mt-2 w-32 bg-black/90 border border-neonBlue/30 shadow-2xl overflow-hidden z-50 animate-fade-in">
                     {/* Tech header */}
                    <div className="h-1 w-full bg-neonBlue"></div>
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {yearRange.map(y => (
                            <button
                                key={y}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleYearChange(y);
                                }}
                                onMouseEnter={playHover}
                                className={`
                                    w-full px-4 py-2 text-left font-mono text-xs md:text-sm transition-all duration-100 border-b border-white/5
                                    ${y === year 
                                        ? 'text-black bg-neonBlue font-bold' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-neonBlue'}
                                `}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>
              )}
          </div>
        </div>

        {/* Desktop Legend */}
        <div className="hidden lg:flex items-center gap-4 font-mono text-[10px]">
           <div className="flex items-center gap-2 px-2 py-1 border border-neonRed/20 bg-neonRed/5">
               <div className="w-1.5 h-1.5 bg-neonRed shadow-[0_0_5px_#ff2a2a]"></div>
               <span className="text-neonRed tracking-wider">CRITICAL (HOLIDAY)</span>
           </div>
           <div className="flex items-center gap-2 px-2 py-1 border border-neonPurple/20 bg-neonPurple/5">
               <div className="w-1.5 h-1.5 bg-neonPurple shadow-[0_0_5px_#bc13fe]"></div>
               <span className="text-neonPurple tracking-wider">OPTIONAL (CUTI)</span>
           </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {loading && (
             <span className="hidden md:inline-block text-xs font-mono text-neonBlue animate-pulse">
                 :: SYNCING ::
             </span>
          )}
          
          {/* Sound Toggle */}
          <button 
            onClick={handleToggleMute}
            onMouseEnter={playHover}
            className={`w-10 h-10 flex items-center justify-center border transition-all group ${isMuted ? 'border-white/10 hover:border-neonRed hover:bg-neonRed/10' : 'border-white/10 hover:border-neonBlue hover:bg-neonBlue/10'}`}
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Initialize Audio" : "Mute Audio"}
          >
             {isMuted ? (
                 <VolumeX className="w-5 h-5 text-slate-500 group-hover:text-neonRed transition-colors" />
             ) : (
                 <Volume2 className="w-5 h-5 text-slate-400 group-hover:text-neonBlue transition-colors" />
             )}
          </button>

          {/* Tactical Planner Toggle */}
          <button 
            onClick={handleOpenLeavePlanner}
            onMouseEnter={playHover}
            className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-neonBlue hover:bg-neonBlue/10 transition-all group relative"
            aria-label="Leave Planner"
            title="Tactical Leave Optimization"
          >
             <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-neonBlue transition-colors" />
             <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-neonGreen rounded-full animate-pulse"></div>
          </button>

          {/* View All Toggle */}
          <button 
            onClick={handleOpenYearView}
            onMouseEnter={playHover}
            className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-neonBlue hover:bg-neonBlue/10 transition-all group"
            aria-label="View Year List"
            title="System Overview"
          >
             <ListIcon className="w-5 h-5 text-slate-400 group-hover:text-neonBlue transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Calendar Area */}
        <main className="flex-1 px-2 md:px-12 pb-4 md:pb-8 flex flex-col relative overflow-y-auto custom-scrollbar">
            
            {/* Container */}
            <div className="flex flex-col h-full w-full max-w-7xl mx-auto transition-all duration-300 mt-4">

                {/* Month Controls & Heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-6 gap-4 px-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                            <div className="w-2 h-2 bg-neonBlue animate-pulse"></div>
                            <p className="text-neonBlue font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase">System Date: {currentDate.toISOString().split('T')[0]}</p>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-bold tracking-tighter font-mono text-white uppercase glitch-text relative inline-block">
                            {currentDate.toLocaleString('id-ID', { month: 'long' })}
                            {/* Decorative lines */}
                            <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-neonBlue to-transparent"></span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3 self-end md:self-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                            onMouseEnter={playHover}
                            className="w-10 h-10 md:w-12 md:h-12 border border-neonBlue/20 bg-black/40 hover:bg-neonBlue hover:text-black hover:border-neonBlue text-neonBlue transition-all flex items-center justify-center"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                            onMouseEnter={playHover}
                            className="w-10 h-10 md:w-12 md:h-12 border border-neonBlue/20 bg-black/40 hover:bg-neonBlue hover:text-black hover:border-neonBlue text-neonBlue transition-all flex items-center justify-center"
                        >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container - Tech Border */}
                <div className="flex-1 tech-border bg-black/40 backdrop-blur-sm border border-white/5 p-2 md:p-6 relative flex flex-col min-h-[400px]">
                    
                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-neonBlue"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-neonBlue"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-neonBlue"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-neonBlue"></div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 md:mb-4 border-b border-dashed border-white/10 pb-2">
                        {DAYS_OF_WEEK.map((day, i) => (
                            <div key={day} className={`text-center font-mono text-[10px] md:text-sm font-bold uppercase tracking-widest ${i === 0 ? 'text-neonRed' : 'text-slate-500'}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 flex-1 gap-1 md:gap-3">
                        {calendarDays.map((dayObj, idx) => {
                            const isRed = isRedDate(dayObj.date);
                            const isCuti = isCutiBersama(dayObj.date);
                            const isSelected = selectedDate && formatDateKey(selectedDate) === formatDateKey(dayObj.date);
                            const isToday = formatDateKey(new Date()) === formatDateKey(dayObj.date);
                            const dateKey = formatDateKey(dayObj.date);
                            const dayHolidays = getHolidaysForDate(dayObj.date);

                            // Styles
                            let bgClass = "bg-white/[0.02] hover:bg-neonBlue/10";
                            let textClass = "text-slate-400";
                            let borderClass = "border border-white/5";

                            if (!dayObj.isCurrentMonth) {
                                textClass = "text-slate-700 opacity-30";
                                bgClass = "bg-transparent";
                            } else {
                                if (isRed) {
                                    textClass = "text-neonRed font-bold";
                                    borderClass = "border border-neonRed/20";
                                    bgClass = "bg-neonRed/[0.05]";
                                } else if (isCuti) {
                                    textClass = "text-neonPurple font-bold";
                                    borderClass = "border border-neonPurple/20";
                                    bgClass = "bg-neonPurple/[0.05]";
                                }
                            }

                            if (isToday) {
                                 bgClass = "bg-neonBlue/10";
                                 borderClass = "border border-neonBlue text-neonBlue";
                                 if (!isRed && !isCuti) textClass = "text-neonBlue font-bold";
                            }

                            if (isSelected) {
                                bgClass = "bg-neonBlue text-black";
                                textClass = "text-black font-bold";
                                borderClass = "border border-neonBlue shadow-[0_0_15px_#00f3ff]";
                            }

                            return (
                                <button
                                    key={`${idx}-${dateKey}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectDate(dayObj.date);
                                    }}
                                    onMouseEnter={playHover}
                                    className={`
                                        relative flex flex-col items-start justify-start p-1 md:p-3 transition-all duration-200
                                        ${bgClass} ${borderClass}
                                        hover:scale-[0.98]
                                        group min-h-[50px] md:min-h-[80px]
                                    `}
                                >
                                    <span className={`text-xs md:text-lg font-mono z-10 ${textClass}`}>
                                        {String(dayObj.date.getDate()).padStart(2, '0')}
                                    </span>

                                    {/* Tech Dots */}
                                    <div className="flex gap-0.5 md:gap-1 mt-auto flex-wrap w-full">
                                        {dayHolidays.map((h, i) => {
                                            let dotColor = 'bg-slate-600';
                                            if (h.type === HolidayType.NATIONAL) dotColor = 'bg-neonRed shadow-[0_0_4px_#ff2a2a]';
                                            else if (h.type === HolidayType.CUTI_BERSAMA) dotColor = 'bg-neonPurple shadow-[0_0_4px_#bc13fe]';
                                            else dotColor = 'bg-neonGreen shadow-[0_0_4px_#00ff9d]';

                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-sm ${dotColor} ${isSelected && (h.type === HolidayType.NATIONAL || h.type === HolidayType.CUTI_BERSAMA) ? 'bg-black' : ''}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>

        {/* Detail Modal */}
        {selectedDate && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedDate(null)}
          >
              <div 
                className="w-full max-w-md h-auto max-h-[80vh] bg-black border border-neonBlue shadow-[0_0_30px_rgba(0,243,255,0.15)] relative overflow-hidden transform transition-all scale-100" 
                onClick={(e) => e.stopPropagation()}
              >
                 {/* Tech Decoration */}
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonBlue via-neonPurple to-neonBlue animate-pulse"></div>
                 
                 <HolidayDetail 
                    selectedDate={selectedDate} 
                    holidays={getHolidaysForDate(selectedDate)} 
                    onClose={() => { playClick(); setSelectedDate(null); }}
                />
              </div>
          </div>
        )}

        {/* Year View Modal */}
        {showYearView && (
          <YearViewModal 
            year={year}
            holidays={holidays}
            onClose={() => { playClick(); setShowYearView(false); }}
            onYearChange={(newYear) => { playClick(); setCurrentDate(new Date(newYear, 0, 1)); }}
          />
        )}
        
        {/* Leave Planner Modal */}
        {showLeavePlanner && (
          <LeavePlannerModal 
            year={year}
            holidays={holidays}
            onClose={() => { playClick(); setShowLeavePlanner(false); }}
            onYearChange={(newYear) => { playClick(); setCurrentDate(new Date(newYear, 0, 1)); }}
          />
        )}

        {/* Footer Stats */}
        <footer className="h-8 bg-black border-t border-white/10 flex items-center justify-between px-4 text-[9px] md:text-[10px] font-mono text-slate-500 z-20">
            <div className="flex gap-4">
                <button 
                    onClick={handleToggleMute}
                    className={`hover:text-white ${isMuted ? 'text-neonRed line-through' : 'text-neonGreen'}`}
                >
                    AUDIO: {isMuted ? 'OFF' : 'ON'}
                </button>
                <span className="hidden md:inline">MEM: 64MB</span>
                <span className="hidden md:inline">LATENCY: 12ms</span>
            </div>
            <div className="uppercase">
                 SECURE CONNECTION // ENCRYPTED
            </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
