import { useEffect, useState } from "react";
import {
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ProbabilityResultsProps {
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface DailyData {
  date: string;
  dayName: string;
  temperature_max: number;
  temperature_min: number;
  windspeed_max: number;
  precipitation_sum: number;
  precipitation_probability: number;
  humidity: number;
  probability: number;
}

const ProbabilityResults = ({
  location = "Mumbai",
  latitude = 19.076,
  longitude = 72.8777,
}: ProbabilityResultsProps) => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherForecast = async () => {
      try {
        setLoading(true);
        setError(null);

        if (
          !latitude ||
          !longitude ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          setError("Invalid coordinates provided");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          daily: [
            "temperature_2m_max",
            "temperature_2m_min",
            "windspeed_10m_max",
            "precipitation_sum",
            "weathercode",
          ].join(","),
          timezone: "auto",
          forecast_days: "7",
        });

        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Weather API failed: ${res.statusText}`);
        }

        const data = await res.json();
        const daily = data.daily;

        const forecastData: DailyData[] = daily.time.map(
          (date: string, idx: number) => {
            const tempMax = daily.temperature_2m_max[idx];
            const tempMin = daily.temperature_2m_min[idx];
            const wind = daily.windspeed_10m_max[idx];
            const precip = daily.precipitation_sum[idx];
            const weatherCode = daily.weathercode[idx];

            // Estimate precipitation probability from weather code and precipitation
            let precipProb = 0;
            if (precip > 0) {
              if (precip > 10) precipProb = 90;
              else if (precip > 5) precipProb = 75;
              else if (precip > 2) precipProb = 60;
              else precipProb = 40;
            } else if (weatherCode >= 51 && weatherCode <= 67) {
              // Rain/drizzle weather codes
              precipProb = 50;
            }

            // Estimate humidity from weather patterns (60-80% typical range)
            let humidity = 65;
            if (weatherCode >= 51 && weatherCode <= 67) humidity = 80; // Rainy
            else if (weatherCode === 0) humidity = 50; // Clear
            else if (tempMax > 30) humidity = 70; // Hot and humid

            let score = 0;

            // Temperature extremes
            const avgTemp = (tempMax + tempMin) / 2;
            if (avgTemp > 38 || avgTemp < 0) score += 30;
            else if (avgTemp > 33 || avgTemp < 5) score += 20;
            else if (avgTemp > 28 || avgTemp < 10) score += 10;

            // Wind speed
            if (wind > 50) score += 25;
            else if (wind > 30) score += 20;
            else if (wind > 20) score += 10;

            // Precipitation
            if (precip > 50) score += 25;
            else if (precip > 20) score += 15;
            else if (precip > 5) score += 10;

            // Precipitation probability
            if (precipProb > 80) score += 10;
            else if (precipProb > 60) score += 5;

            // Humidity
            if (humidity > 90) score += 10;
            else if (humidity < 20) score += 10;

            const probability = Math.min(100, score);

            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
            });

            return {
              date,
              dayName: idx === 0 ? "Today" : dayName,
              temperature_max: Math.round(tempMax),
              temperature_min: Math.round(tempMin),
              windspeed_max: Math.round(wind),
              precipitation_sum: Math.round(precip * 10) / 10,
              precipitation_probability: precipProb,
              humidity: humidity,
              probability: Math.round(probability),
            };
          }
        );

        setDailyData(forecastData);
        localStorage.setItem("geminiData", JSON.stringify(forecastData));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchWeatherForecast();
  }, [latitude, longitude]);

  const handleDownload = (format: "csv" | "json") => {
    const dataStr =
      format === "json"
        ? JSON.stringify(dailyData, null, 2)
        : `Date,Day,Max Temp(°C),Min Temp(°C),Max Wind(km/h),Precipitation(mm),Rain Probability(%),Humidity(%),Risk Probability(%)\n${dailyData
            .map(
              (d) =>
                `${d.date},${d.dayName},${d.temperature_max},${d.temperature_min},${d.windspeed_max},${d.precipitation_sum},${d.precipitation_probability},${d.humidity},${d.probability}`
            )
            .join("\n")}`;
    const blob = new Blob([dataStr], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weather-forecast-${location}.${format}`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Cloud className="h-16 w-16 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-xl font-medium">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="p-8 border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mb-3 mx-auto" />
          <p className="text-red-600 text-center font-medium">{error}</p>
        </Card>
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="p-8">
          <p className="text-gray-600 text-center">
            No forecast data available
          </p>
        </Card>
      </div>
    );
  }

  const todayProb = dailyData[0]?.probability || 0;
  const avgProb = Math.round(
    dailyData.reduce((sum, d) => sum + d.probability, 0) / dailyData.length
  );
  const maxProb = Math.max(...dailyData.map((d) => d.probability));

  const getSeverityColor = (p: number) =>
    p >= 70 ? "text-red-600" : p >= 40 ? "text-yellow-600" : "text-green-600";
  const getSeverityBg = (p: number) =>
    p >= 70
      ? "bg-red-50 border-red-300"
      : p >= 40
      ? "bg-yellow-50 border-yellow-300"
      : "bg-green-50 border-green-300";
  const getSeverityIcon = (p: number) =>
    p >= 70 ? (
      <AlertCircle className="h-5 w-5" />
    ) : p >= 40 ? (
      <TrendingUp className="h-5 w-5" />
    ) : (
      <CheckCircle className="h-5 w-5" />
    );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card className="p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {location} Weather Forecast
            </h2>
            <p className="text-sm text-gray-500">
              7-Day Risk Analysis powered by NASA POWER API
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleDownload("csv")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button
              onClick={() => handleDownload("json")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" /> JSON
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className={`p-6 rounded-xl border-2 ${getSeverityBg(todayProb)}`}
          >
            <div
              className={`flex items-center gap-3 mb-3 ${getSeverityColor(
                todayProb
              )}`}
            >
              {getSeverityIcon(todayProb)}
              <h3 className="font-bold text-lg">Today's Risk</h3>
            </div>
            <p
              className={`text-5xl font-bold mb-2 ${getSeverityColor(
                todayProb
              )}`}
            >
              {todayProb}%
            </p>
            <Progress value={todayProb} className="h-3" />
          </div>

          <div className="p-6 rounded-xl border-2 bg-blue-50 border-blue-300">
            <div className="flex items-center gap-3 mb-3 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-bold text-lg">Week Average</h3>
            </div>
            <p className="text-5xl font-bold mb-2 text-blue-700">{avgProb}%</p>
            <Progress value={avgProb} className="h-3" />
          </div>

          <div className={`p-6 rounded-xl border-2 ${getSeverityBg(maxProb)}`}>
            <div
              className={`flex items-center gap-3 mb-3 ${getSeverityColor(
                maxProb
              )}`}
            >
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-lg">Peak Risk</h3>
            </div>
            <p
              className={`text-5xl font-bold mb-2 ${getSeverityColor(maxProb)}`}
            >
              {maxProb}%
            </p>
            <Progress value={maxProb} className="h-3" />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Weather Risk Probability
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="dayName"
                  stroke="#6b7280"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                />
                <YAxis domain={[0, 100]} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    borderRadius: "12px",
                    border: "2px solid #e5e7eb",
                    padding: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  stroke="#ef4444"
                  strokeWidth={4}
                  fill="url(#colorProb)"
                  name="Risk Probability (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-orange-500" />
                Temperature Range
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient
                      id="colorTempMax"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#f59e0b"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorTempMin"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dayName" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temperature_max"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#colorTempMax)"
                    name="Max Temp (°C)"
                  />
                  <Area
                    type="monotone"
                    dataKey="temperature_min"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorTempMin)"
                    name="Min Temp (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wind className="h-6 w-6 text-blue-500" />
                Wind Speed
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dayName" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="windspeed_max"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={{ r: 6, fill: "#3b82f6" }}
                    name="Max Wind (km/h)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Droplets className="h-6 w-6 text-cyan-500" />
              Precipitation & Probability
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dayName" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="precipitation_sum"
                  stroke="#06b6d4"
                  strokeWidth={4}
                  dot={{ r: 6, fill: "#06b6d4" }}
                  name="Precipitation (mm)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="precipitation_probability"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ r: 5, fill: "#8b5cf6" }}
                  name="Rain Chance (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Daily Breakdown</h3>
            <div className="grid grid-cols-1 gap-4">
              {dailyData.map((day) => (
                <div
                  key={day.date}
                  className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${getSeverityBg(
                    day.probability
                  )}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-lg font-bold text-gray-700 w-20">
                        {day.dayName}
                      </div>
                      <div className="flex items-center gap-3">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        <span className="text-xl font-bold text-orange-600">
                          {day.temperature_max}°
                        </span>
                        <span className="text-gray-400 font-medium">/</span>
                        <span className="text-xl font-semibold text-blue-600">
                          {day.temperature_min}°
                        </span>
                      </div>
                      <div className="flex items-center gap-5 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Wind className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">
                            {day.windspeed_max} km/h
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-cyan-500" />
                          <span className="font-medium">
                            {day.precipitation_sum} mm (
                            {day.precipitation_probability}%)
                          </span>
                        </span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-3 ${getSeverityColor(
                        day.probability
                      )}`}
                    >
                      {getSeverityIcon(day.probability)}
                      <span className="font-bold text-2xl">
                        {day.probability}%
                      </span>
                      <span className="text-sm font-medium">Risk</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProbabilityResults;
