import { useState } from "react";
import { CloudSun, Sparkles, TrendingUp, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationSelector from "@/components/LocationSelector";
import DateSelector from "@/components/DateSelector";
import WeatherVariables from "@/components/WeatherVariables";
import ProbabilityResults from "@/components/ProbabilityResults";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import heroImage from "@/assets/hero-weather.jpg";
import GeminiResponse from "@/components/GeminiInsight";

const Index = () => {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = () => {
    if (!location) {
      toast.error("Please select a location");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (selectedVariables.length === 0) {
      toast.error("Please select at least one weather variable");
      return;
    }

    toast.success("Analyzing weather patterns...");
    setShowResults(true);

    // Smooth scroll to results
    setTimeout(() => {
      document
        .getElementById("results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WeatherProb
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Powered by NASA Earth Observation Data
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Plan Your Perfect
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Outdoor Adventure
              </span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Know the odds before you go. Get historical weather probability
              analysis for any location and date to make informed decisions
              about your outdoor activities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
              <div className="p-6 backdrop-blur-sm bg-card/60 rounded-xl border border-primary/20">
                <Database className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  1+ Year of Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Historical patterns from decades of NASA observations
                </p>
              </div>
              <div className="p-6 backdrop-blur-sm bg-card/60 rounded-xl border border-primary/20">
                <TrendingUp className="h-8 w-8 text-secondary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  Trend Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track changing weather patterns over time
                </p>
              </div>
              <div className="p-6 backdrop-blur-sm bg-card/60 rounded-xl border border-primary/20">
                <Sparkles className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  Smart Insights
                </h3>
                <p className="text-sm text-muted-foreground">
                  Easy-to-understand probability scores and recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Query Interface */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Start Your Analysis
            </h2>
            <p className="text-muted-foreground">
              Enter your destination, select a date, and choose weather
              variables to analyze
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <LocationSelector onLocationSelect={setLocation} />
            <DateSelector onDateSelect={setSelectedDate} />
          </div>

          <div className="mb-8">
            <WeatherVariables onVariablesChange={setSelectedVariables} />
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              className="px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-[var(--shadow-glow)] transition-all hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Analyze Weather Probability
            </Button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {showResults && location && selectedDate && (
        <section
          id="results"
          className="container mx-auto px-4 py-16 bg-muted/30"
        >
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
            <ProbabilityResults
              location={location.name}
              longitude={location.lng}
              latitude={location.lat}
            />
            <GeminiResponse />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-primary/20 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by NASA Earth Observation Data • Historical Weather Analysis
            Platform
          </p>
          <p className="mt-2">
            Data sources: NASA POWER, MODIS, GPM, and other Earth observation
            satellites
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
