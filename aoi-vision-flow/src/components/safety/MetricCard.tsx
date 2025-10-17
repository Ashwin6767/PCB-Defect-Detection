import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  subtitle?: string;
}

const MetricCard = ({ title, value, unit, icon, subtitle }: MetricCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        </div>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};

export default MetricCard;