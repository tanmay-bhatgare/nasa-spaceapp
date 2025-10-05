// fetchPowerData.ts
export interface PowerDataParams {
  lat: number; // Latitude of the location
  lon: number; // Longitude of the location
  startDate: string; // Start date in YYYYMMDD format
  endDate: string; // End date in YYYYMMDD format
  parameters: string[]; // Weather variables (e.g., ["T2M", "PRECTOT"])
  community?: string; // Defaults to "RE" (Renewable Energy)
  format?: "JSON" | "CSV"; // Data format, default JSON
}
