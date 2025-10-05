import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  onDateSelect: (date: Date | undefined) => void;
}

const DateSelector = ({ onDateSelect }: DateSelectorProps) => {
  const [date, setDate] = useState<Date>();

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateSelect(newDate);
  };

  return (
    <Card className="p-6 backdrop-blur-sm bg-card/80 border-primary/20 shadow-[var(--shadow-soft)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Select Date</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Select any date to see historical weather probability patterns
        </p>

        <div>
          <label className="text-sm font-medium mb-2 block">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 border-primary/30 hover:border-primary hover:bg-background/70",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-primary/30">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                className="rounded-lg"
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
};

export default DateSelector;
