import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
}

const LocationSelector = ({ onLocationSelect }: LocationSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Mock location data - in production, this would use a geocoding API
      const mockLocation = {
        lat: 37.7749,
        lng: -122.4194,
        name: searchQuery,
      };
      setSelectedLocation(searchQuery);
      onLocationSelect(mockLocation);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card className="p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Select Location</h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter city, park, or trail name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-background/50 border-primary/30 focus:border-primary transition-colors"
          />
          <Button 
            onClick={handleSearch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {selectedLocation && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{selectedLocation}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          Tip: Enter any location worldwide to see historical weather patterns
        </div>
      </div>
    </Card>
  );
};

export default LocationSelector;
