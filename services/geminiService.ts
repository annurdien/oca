import { Holiday, HolidayType } from "../types";

interface ApiHoliday {
  date: string;
  name: string;
}

export const fetchIndonesianHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    // Using the new API: https://libur.deno.dev/
    const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data: ApiHoliday[] = await response.json();

    return data.map((item) => {
      // The API returns dates in YYYY-MM-DD format
      const formattedDate = item.date;

      // Determine type based on name
      // The API returns official holidays. We distinguish Cuti Bersama by name.
      let type = HolidayType.NATIONAL;
      const lowerName = item.name.toLowerCase();
      
      if (lowerName.includes('cuti bersama')) {
        type = HolidayType.CUTI_BERSAMA;
      }

      // Generate description
      let description = "Official National Holiday (Tanggal Merah).";
      if (type === HolidayType.CUTI_BERSAMA) {
        description = "Joint Leave Holiday (Cuti Bersama) - Government offices closed.";
      }

      return {
        date: formattedDate,
        name: item.name,
        type,
        description
      };
    });
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
    return [];
  }
};