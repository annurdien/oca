import React from 'react';
import { Holiday, HolidayType } from '../types';
import { Sparkles, X } from './Icons';
import { playClick, playHover } from '../services/audioEngine';

interface HolidayDetailProps {
  selectedDate: Date | null;
  holidays: Holiday[];
  onClose: () => void;
}

const HolidayDetail: React.FC<HolidayDetailProps> = ({ selectedDate, holidays, onClose }) => {
  if (!selectedDate) return null;

  const isSunday = selectedDate.getDay() === 0;
  const hasNational = holidays.some(h => h.type === HolidayType.NATIONAL);
  const hasHolidays = holidays.length > 0;

  const getAccentColor = (h: Holiday) => {
      switch (h.type) {
          case HolidayType.NATIONAL: return 'text-neonRed border-neonRed bg-neonRed/10';
          case HolidayType.CUTI_BERSAMA: return 'text-neonPurple border-neonPurple bg-neonPurple/10';
          default: return 'text-neonGreen border-neonGreen bg-neonGreen/10';
      }
  };

  const handleClose = () => {
      playClick();
      onClose();
  };

  return (
    <div className="h-full flex flex-col p-6 relative text-white">
       {/* Grid Background */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
       
       {/* Close Button */}
       <button 
         onClick={handleClose}
         onMouseEnter={playHover}
         className="absolute top-4 right-4 z-50 p-2 border border-white/20 hover:bg-neonRed hover:text-black hover:border-neonRed transition-colors"
       >
         <X className="w-4 h-4" />
       </button>

       {/* Header Date */}
       <div className="mb-6 border-b border-dashed border-white/20 pb-4">
        <div className="flex items-end gap-4">
            <h2 className="text-6xl font-bold font-mono text-white">
                {String(selectedDate.getDate()).padStart(2, '0')}
            </h2>
            <div className="flex flex-col pb-2">
                <span className="text-neonBlue font-mono text-sm tracking-widest uppercase">
                    {selectedDate.toLocaleDateString('id-ID', { month: 'long' })}
                </span>
                <span className="text-slate-500 font-mono text-xs uppercase">
                    {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })} // {selectedDate.getFullYear()}
                </span>
            </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isSunday || hasNational ? 'bg-neonRed animate-pulse' : 'bg-neonGreen'}`}></div>
             <span className="font-mono text-[10px] tracking-widest text-slate-400">
                 STATUS: {isSunday || hasNational ? 'RESTRICTED / HOLIDAY' : 'OPERATIONAL'}
             </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-10 max-h-[400px]">
        
        {!hasHolidays && !isSunday && (
            <div className="flex flex-col items-center justify-center h-32 text-center border border-white/5 bg-white/[0.02] p-4">
                <span className="font-mono text-neonBlue mb-2 text-xl">[ EMPTY_SLOT ]</span>
                <p className="text-slate-500 font-mono text-xs">NO HOLIDAY DATA DETECTED.</p>
                <p className="text-slate-600 text-[10px] mt-1">Standard operational procedures apply.</p>
            </div>
        )}

        {isSunday && (
           <div className="border-l-2 border-neonRed pl-4 py-2 bg-gradient-to-r from-neonRed/5 to-transparent">
                <div className="flex justify-between items-start mb-1">
                     <h3 className="text-lg font-bold font-mono text-neonRed uppercase">Sunday</h3>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                    WEEKLY MANDATORY DOWNTIME.
                </p>
           </div>
        )}

        {holidays.map((holiday, idx) => {
          const colorClasses = getAccentColor(holiday);

          return (
            <div 
              key={idx} 
              className={`
                  p-4 border border-l-4 relative group transition-all duration-300 hover:bg-white/5
                  ${colorClasses.split(' ')[1]} ${colorClasses.split(' ')[2]}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-mono font-bold px-1 border ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} bg-transparent uppercase`}>
                      TYPE: {holiday.type}
                  </span>
              </div>

              <h3 className="text-lg font-bold mb-1 font-mono text-white leading-tight">
                  {holiday.name}
              </h3>
              
              <p className="text-xs text-slate-400 font-mono border-t border-dashed border-white/10 pt-2 mt-2">
                {holiday.description}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-2 border-t border-white/10 text-center">
          <p className="text-[9px] font-mono text-slate-600 uppercase">ID: {selectedDate.getTime().toString(16)}</p>
      </div>
    </div>
  );
};

export default HolidayDetail;