import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Holiday, HolidayType } from '../types';
import { Download, X, Sparkles, ChevronLeft, ChevronRight } from './Icons';
import { playClick, playHover, playSuccess } from '../services/audioEngine';

interface YearViewModalProps {
  year: number;
  holidays: Record<string, Holiday[]>;
  onClose: () => void;
  onYearChange: (year: number) => void;
}

const YearViewModal: React.FC<YearViewModalProps> = ({ year, holidays, onClose, onYearChange }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sortedHolidays = Object.values(holidays)
    .flat()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const getHolidaysInMonth = (monthIndex: number) => {
    return sortedHolidays.filter(h => {
        const d = new Date(h.date);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
  };

  const handleExport = async () => {
    playClick();
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const originalElement = exportRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      const posterWidth = 1200;
      
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '-10000px';
      clone.style.width = `${posterWidth}px`; 
      clone.style.height = 'auto'; 
      clone.style.minHeight = '100vh';
      clone.style.zIndex = '-9999';
      clone.style.overflow = 'visible';
      clone.style.backgroundColor = '#030508'; 
      
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: '#030508',
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: posterWidth,
      });

      document.body.removeChild(clone);

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `OCA_System_Calendar_${year}.png`;
      link.click();
      
      playSuccess(); // Sound effect on success
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-7xl h-full md:h-[90vh] bg-deepSpace border border-neonBlue/20 md:rounded-none shadow-2xl flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/60 z-20">
          <div className="flex items-center gap-4">
             <div className="hidden md:block w-2 h-8 bg-neonBlue"></div>
             <h2 className="text-lg md:text-2xl font-bold text-white font-mono tracking-tight">SYSTEM_OVERVIEW</h2>
             
             <div className="flex items-center gap-1 bg-white/5 p-1 border border-white/10">
                <button 
                  onClick={() => { playClick(); onYearChange(year - 1); }}
                  onMouseEnter={playHover}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neonBlue hover:text-black text-slate-400 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-0.5 text-neonBlue font-mono text-lg font-bold min-w-[60px] text-center border-x border-white/10">
                    {year}
                </span>
                <button 
                  onClick={() => { playClick(); onYearChange(year + 1); }}
                  onMouseEnter={playHover}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neonBlue hover:text-black text-slate-400 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              onMouseEnter={playHover}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 bg-neonBlue/10 border border-neonBlue text-neonBlue hover:bg-neonBlue hover:text-black font-mono text-xs transition-all"
            >
              {isExporting ? (
                 <span className="animate-pulse">PROCESSING...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">EXPORT_DATA</span>
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              onMouseEnter={playHover}
              className="w-10 h-10 flex items-center justify-center hover:bg-neonRed hover:text-black text-slate-400 border border-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-deepSpace">
          
          <div 
            ref={exportRef} 
            id="export-target"
            className="bg-deepSpace relative min-w-full md:min-w-[800px] mx-auto max-w-6xl p-4 md:p-16"
          >
            {/* Tech Grid Background for Poster */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
            
            {/* Poster Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b-2 border-neonBlue pb-6">
               <div className="mb-4 md:mb-0">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-neonRed animate-pulse"></div>
                    <p className="text-neonRed font-mono text-[10px] uppercase tracking-[0.3em]">Confidential Data</p>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-bold text-white font-mono tracking-tighter">ANNUAL REPORT</h1>
               </div>
               <div className="text-left md:text-right w-full md:w-auto">
                  <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 font-mono leading-none">
                    {year}
                  </h1>
                  <p className="text-xs text-neonBlue font-mono tracking-widest mt-1">OCA SYSTEM V9.0 GENERATED</p>
               </div>
            </div>

            {/* Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {months.map((monthIndex) => {
                const monthHols = getHolidaysInMonth(monthIndex);
                if (monthHols.length === 0) return null;

                return (
                  <div 
                    key={monthIndex} 
                    className="break-inside-avoid border border-white/10 bg-white/[0.02] p-4 hover:border-neonBlue/50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-white/10">
                        <h3 className="text-xl font-bold text-white font-mono">
                        {monthNames[monthIndex]}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">
                            SEC-{String(monthIndex + 1).padStart(2, '0')}
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                      {monthHols.map((h, idx) => {
                        let colorClass = "text-neonGreen";
                        let borderClass = "border-neonGreen";

                        if (h.type === HolidayType.NATIONAL) {
                            colorClass = "text-neonRed";
                            borderClass = "border-neonRed";
                        }
                        if (h.type === HolidayType.CUTI_BERSAMA) {
                            colorClass = "text-neonPurple";
                            borderClass = "border-neonPurple";
                        }
                        
                        const dateObj = new Date(h.date);

                        return (
                          <div key={idx} className="flex items-start gap-3 group">
                            <div className={`
                                flex-shrink-0 w-8 h-8 flex items-center justify-center 
                                border font-mono font-bold text-sm bg-black
                                ${borderClass} ${colorClass}
                            `}>
                              {String(dateObj.getDate()).padStart(2, '0')}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-300 font-mono uppercase leading-tight group-hover:text-white">
                                {h.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] uppercase tracking-wider ${colorClass} opacity-70`}>
                                    {h.type.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-10 pt-4 border-t border-white/10 flex justify-between items-center opacity-50 font-mono text-[8px]">
                <p>OCA_SYS_ADMIN</p>
                <p>END_OF_FILE</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default YearViewModal;