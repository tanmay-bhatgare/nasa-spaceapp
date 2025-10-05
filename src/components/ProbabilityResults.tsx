import { useEffect, useState } from "react";
import { Download, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
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
} from "recharts";

interface ProbabilityResultsProps {
  location: string;
  latitude: number;
  longitude: number;
}

interface HourlyData {
  time: string;
  temperature: number;
  windspeed: number;
  precipitation: number;
  probability: number;
}

const ProbabilityResults = ({
  location,
  latitude,
  longitude,
}: ProbabilityResultsProps) => {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,windspeed_10m,precipitation`
        );
        const data = await res.json();

        // Map hourly arrays into objects
        const hours: HourlyData[] = data.hourly.time.map(
          (t: string, idx: number) => {
            const temp = data.hourly.temperature_2m[idx];
            const wind = data.hourly.windspeed_10m[idx];
            const precip = data.hourly.precipitation[idx];

            // Example probability logic
            let prob = 0;
            if (temp > 30 || wind > 20 || precip > 2) prob = 80;
            else if (temp > 25 || wind > 15 || precip > 0) prob = 50;
            else prob = 20;

            return {
              time: t,
              temperature: temp,
              windspeed: wind,
              precipitation: precip,
              probability: prob,
            };
          }
        );

        setHourlyData(hours);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  const handleDownload = (format: "csv" | "json") => {
    const dataStr =
      format === "json"
        ? JSON.stringify(hourlyData, null, 2)
        : `Time,Temperature,Windspeed,Precipitation,Probability\n${hourlyData
            .map(
              (h) =>
                `${h.time},${h.temperature},${h.windspeed},${h.precipitation},${h.probability}`
            )
            .join("\n")}`;
    const blob = new Blob([dataStr], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weather-probability-${location}.${format}`;
    link.click();
  };

  if (loading) return <p>Loading live weather data...</p>;

  const latestProb = hourlyData[0]?.probability || 0;
  const getSeverityColor = (p: number) =>
    p >= 70 ? "text-destructive" : p >= 40 ? "text-secondary" : "text-accent";
  const getSeverityIcon = (p: number) =>
    p >= 70 ? <AlertCircle /> : p >= 40 ? <TrendingUp /> : <CheckCircle />;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {location} Weather Probability
            </h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleDownload("csv")}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button onClick={() => handleDownload("json")}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${getSeverityColor(latestProb)}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {getSeverityIcon(latestProb)}
            <h3>Probability Score: {latestProb}%</h3>
          </div>
          <Progress value={latestProb} className="h-2 mb-2" />
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => t.split("T")[1].slice(0, 5)}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="probability" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ProbabilityResults;
