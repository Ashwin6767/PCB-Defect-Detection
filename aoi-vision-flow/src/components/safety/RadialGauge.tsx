import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface RadialGaugeProps {
  title: string;
  value: number;
  unit: string;
  maxValue: number;
  icon: React.ReactNode;
  color?: string;
}

const RadialGauge = ({ title, value, unit, maxValue, icon, color = "hsl(var(--primary))" }: RadialGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min((animatedValue / maxValue) * 100, 100);
  const strokeDasharray = 2 * Math.PI * 120;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      <div className="relative w-full aspect-square max-w-xs mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="120"
            stroke="hsl(var(--border))"
            strokeWidth="12"
            fill="none"
            opacity="0.3"
          />
          
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r="120"
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary)/0.3))'
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-foreground mb-1">
            {animatedValue.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {unit}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RadialGauge;