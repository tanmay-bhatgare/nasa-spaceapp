import { useState } from "react";
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface WeatherVariablesProps {
  onVariablesChange: (variables: string[]) => void;
}

const weatherOptions = [
  { id: "temperature", label: "Temperature Extremes", icon: Thermometer, description: "Very hot or very cold conditions" },
  { id: "precipitation", label: "Precipitation", icon: Droplets, description: "Heavy rainfall or storms" },
  { id: "wind", label: "Wind Speed", icon: Wind, description: "Strong winds or gusts" },
  { id: "humidity", label: "Humidity & Comfort", icon: Cloud, description: "High humidity or discomfort index" },
  { id: "airquality", label: "Air Quality", icon: Sun, description: "Dust, pollution levels" },
  { id: "cloudcover", label: "Cloud Cover", icon: CloudRain, description: "Overcast or clear conditions" },
];

const WeatherVariables = ({ onVariablesChange }: WeatherVariablesProps) => {
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  const handleToggle = (variableId: string) => {
    const newSelection = selectedVariables.includes(variableId)
      ? selectedVariables.filter(v => v !== variableId)
      : [...selectedVariables, variableId];
    
    setSelectedVariables(newSelection);
    onVariablesChange(newSelection);
  };

  return (
    <Card className="z-1 p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weather Variables</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weatherOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer border border-transparent hover:border-primary/30"
                onClick={() => handleToggle(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedVariables.includes(option.id)}
                  onCheckedChange={() => handleToggle(option.id)}
                  className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={option.id}
                    className="flex items-center gap-2 font-medium text-foreground cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          Select the weather conditions you want to analyze for your location
        </div>
      </div>
    </Card>
  );
};

export default WeatherVariables;
