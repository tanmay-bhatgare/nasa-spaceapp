import { PowerDataParams } from "./types/api";

export async function fetchPowerData(params: PowerDataParams) {
  const {
    lat,
    lon,
    startDate,
    endDate,
    parameters,
    community = "RE",
    format = "JSON",
  } = params;

  // NASA POWER API endpoint
  const baseUrl = "https://power.larc.nasa.gov/api/temporal/daily/point";

  // Build query string
  const query = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start: startDate,
    end: endDate,
    community,
    parameters: parameters.join(","),
    format,
  });

  const url = `${baseUrl}?${query.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NASA POWER API request failed: ${res.statusText}`);
    }

    if (format === "JSON") {
      const data = await res.json();
      console.log(data);
      return data;
    } else {
      const data = await res.text(); // For CSV
      console.log(data);
      return data;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}
