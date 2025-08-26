import { Button } from "@/components/ui/button";

interface PeriodSelectorProps {
  selectedPeriod: '1D' | '1W' | '1M' | '6M';
  onPeriodChange: (period: '1D' | '1W' | '1M' | '6M') => void;
}

const periods = [
  { value: '1D' as const, label: 'Today' },
  { value: '1W' as const, label: '1W' },
  { value: '1M' as const, label: '1M' },
  { value: '6M' as const, label: '6M' },
];

export default function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex bg-secondary rounded-lg p-1" data-testid="period-selector">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={selectedPeriod === period.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          className={`px-3 py-1 text-sm font-medium transition-all ${
            selectedPeriod === period.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`button-period-${period.value}`}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
