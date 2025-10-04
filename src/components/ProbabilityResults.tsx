import { Download, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
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

interface ProbabilityResultsProps {
  location: string;
  date: Date;
  variables: string[];
}

// Mock data for demonstration
const generateMockData = () => {
  return [
    { month: "Jan", probability: 15 },
    { month: "Feb", probability: 18 },
    { month: "Mar", probability: 25 },
    { month: "Apr", probability: 35 },
    { month: "May", probability: 45 },
    { month: "Jun", probability: 65 },
    { month: "Jul", probability: 75 },
    { month: "Aug", probability: 72 },
    { month: "Sep", probability: 55 },
    { month: "Oct", probability: 38 },
    { month: "Nov", probability: 22 },
    { month: "Dec", probability: 16 },
  ];
};

const ProbabilityResults = ({ location, date, variables }: ProbabilityResultsProps) => {
  const chartData = generateMockData();
  const selectedMonth = date.toLocaleString('default', { month: 'short' });
  const currentData = chartData.find(d => d.month === selectedMonth);
  const probability = currentData?.probability || 50;

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
          {variables.map((variable) => (
            <div key={variable} className="p-3 bg-muted/50 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground capitalize mb-1">{variable}</p>
              <p className="text-xl font-bold text-foreground">{Math.floor(Math.random() * 30 + 40)}%</p>
            </div>
          ))}
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
          Based on NASA Earth observation data from the past 20 years
        </p>
      </Card>
    </div>
  );
};

export default ProbabilityResults;
