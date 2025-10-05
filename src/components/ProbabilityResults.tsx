import { useState, useEffect } from "react";
import { Download, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getWeatherProbabilityAnalysis, WeatherProbabilityData } from "@/services/weatherApi";

interface ProbabilityResultsProps {
  location: string;
  date: Date;
  variables: string[];
  coordinates: { lat: number; lng: number };
}

const ProbabilityResults = ({ location, date, variables, coordinates }: ProbabilityResultsProps) => {
  const [chartData, setChartData] = useState<WeatherProbabilityData[]>([]);
  const [probability, setProbability] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'combined' | 'historical' | 'default'>('default');

  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🎬 useEffect triggered with:', {
          coordinates,
          date: date.toISOString(),
          variables
        });

        const result = await getWeatherProbabilityAnalysis(
          coordinates.lat,
          coordinates.lng,
          date,
          variables
        );
        
        console.log('📱 Setting state:', {
          probability: result.probability,
          dataSource: result.dataSource,
          monthlyDataLength: result.monthlyData.length,
          sampleMonth: result.monthlyData[0]
        });

        setChartData(result.monthlyData);
        setProbability(result.probability);
        setDataSource(result.dataSource);
        
        // Show info about data sources used
        if (result.dataSource === 'combined') {
          console.log('✅ Using combined historical + forecast data');
        } else if (result.dataSource === 'historical') {
          console.log('ℹ️ Using historical data only (forecast unavailable)');
        } else if (result.dataSource === 'default') {
          console.warn('⚠️  Using default estimates - API data unavailable');
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data. Using default values.');
        setDataSource('default');
        // Set default data on error
        setProbability(50);
        setChartData([
          { month: "Jan", probability: 45 },
          { month: "Feb", probability: 42 },
          { month: "Mar", probability: 38 },
          { month: "Apr", probability: 35 },
          { month: "May", probability: 30 },
          { month: "Jun", probability: 25 },
          { month: "Jul", probability: 22 },
          { month: "Aug", probability: 24 },
          { month: "Sep", probability: 28 },
          { month: "Oct", probability: 35 },
          { month: "Nov", probability: 40 },
          { month: "Dec", probability: 43 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [coordinates.lat, coordinates.lng, date, variables]);

  if (isLoading) {
    return (
      <Card className="p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-lg text-muted-foreground">Loading weather data from POWER API...</span>
        </div>
      </Card>
    );
  }

  const handleDownload = (format: 'csv' | 'json') => {
    const dataStr = format === 'json' 
      ? JSON.stringify(chartData, null, 2)
      : `Month,Probability\n${chartData.map(d => `${d.month},${d.probability}`).join('\n')}`;
    
    const dataBlob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-probability-${location}-${date.toISOString().split('T')[0]}.${format}`;
    link.click();
  };

  const getSeverityColor = (prob: number) => {
    if (prob >= 70) return "text-destructive";
    if (prob >= 40) return "text-secondary";
    return "text-accent";
  };

  const getSeverityIcon = (prob: number) => {
    if (prob >= 70) return <AlertCircle className="h-5 w-5" />;
    if (prob >= 40) return <TrendingUp className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Weather Probability Analysis</h2>
            <p className="text-muted-foreground">
              {location} • {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {error && (
              <p className="text-sm text-orange-500 mt-1">
                ⚠️ {error}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {dataSource === 'combined' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Combined Historical + Forecast Data
                </span>
              )}
              {dataSource === 'historical' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Historical Data Only
                </span>
              )}
              {dataSource === 'default' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full border border-gray-500/20">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  Default Estimates
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Data provided by Open-Meteo Historical Weather & Forecast API
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('csv')}
              className="border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('json')}
              className="border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className={`p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 mb-6 ${getSeverityColor(probability)}`}>
          <div className="flex items-center gap-3 mb-3">
            {getSeverityIcon(probability)}
            <h3 className="font-semibold text-lg">Probability Score: {probability}%</h3>
          </div>
          <Progress value={probability} className="h-2 mb-2" />
          <p className="text-sm opacity-90">
            {probability >= 70 && "High likelihood of adverse conditions. Consider alternate dates."}
            {probability >= 40 && probability < 70 && "Moderate chance of unfavorable weather. Be prepared."}
            {probability < 40 && "Low probability of severe weather. Good conditions expected."}
          </p>
        </div>

        {/* Variables Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {variables.map((variable) => {
            // Calculate real probability for each variable from the selected month's data
            const selectedMonthStr = date.toLocaleString('default', { month: 'short' });
            const selectedMonthData = chartData.find(d => d.month === selectedMonthStr);
            
            let variableProbability = probability; // Default to overall probability
            
            // Calculate specific probabilities based on the variable type and actual data
            if (selectedMonthData) {
              if (variable.toLowerCase() === 'temperature' && selectedMonthData.avgTemperature !== undefined) {
                // Temperature: Adverse if < 5°C or > 32°C
                const temp = selectedMonthData.avgTemperature;
                if (temp < 5) {
                  variableProbability = Math.round(Math.min(95, 70 + (5 - temp) * 5));
                } else if (temp > 32) {
                  variableProbability = Math.round(Math.min(95, 70 + (temp - 32) * 5));
                } else {
                  // Comfortable range
                  variableProbability = Math.round(Math.max(5, 30 - Math.abs(temp - 18.5) * 2));
                }
              } else if (variable.toLowerCase() === 'precipitation' && selectedMonthData.avgPrecipitation !== undefined) {
                // Precipitation: More precipitation = higher probability of adverse conditions
                const precip = selectedMonthData.avgPrecipitation;
                variableProbability = Math.round(Math.min(95, Math.max(5, (precip / 10) * 100)));
              } else if (variable.toLowerCase() === 'wind' && selectedMonthData.avgWindSpeed !== undefined) {
                // Wind: Higher wind speed = higher probability
                const wind = selectedMonthData.avgWindSpeed;
                variableProbability = Math.round(Math.min(95, Math.max(5, (wind / 30) * 100)));
              }
            }
            
            return (
              <div key={variable} className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground capitalize mb-1">{variable}</p>
                <p className="text-xl font-bold text-foreground">{variableProbability}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMonthData && (
                    <>
                      {variable.toLowerCase() === 'temperature' && selectedMonthData.avgTemperature !== undefined && 
                        `Avg: ${selectedMonthData.avgTemperature.toFixed(1)}°C`}
                      {variable.toLowerCase() === 'precipitation' && selectedMonthData.avgPrecipitation !== undefined && 
                        `Avg: ${selectedMonthData.avgPrecipitation.toFixed(1)}mm`}
                      {variable.toLowerCase() === 'wind' && selectedMonthData.avgWindSpeed !== undefined && 
                        `Avg: ${selectedMonthData.avgWindSpeed.toFixed(1)}km/h`}
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Annual Probability Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="probability" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Adverse Weather Probability"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Historical Trends */}
      <Card className="p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
        <h3 className="text-lg font-semibold text-foreground mb-4">Historical Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar 
              dataKey="probability" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              name="Probability"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4">
          {dataSource === 'combined' && (
            <>Based on 10 years of historical data combined with 16-day forecast • Sources: archive-api.open-meteo.com & api.open-meteo.com</>
          )}
          {dataSource === 'historical' && (
            <>Based on 10 years of historical data • Source: archive-api.open-meteo.com</>
          )}
          {dataSource === 'default' && (
            <>Using estimated default values • Unable to fetch real-time data</>
          )}
        </p>
      </Card>
    </div>
  );
};

export default ProbabilityResults;
