export enum HolidayType {
  NATIONAL = 'NATIONAL',
  CUTI_BERSAMA = 'CUTI_BERSAMA',
  OBSERVANCE = 'OBSERVANCE', // For regional or religious holidays that are not national red dates
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayType;
  description: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  holidays: Holiday[];
  isWeekend: boolean;
}

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  holidays: Record<string, Holiday[]>; // Key: YYYY-MM-DD
  isLoading: boolean;
  error: string | null;
}