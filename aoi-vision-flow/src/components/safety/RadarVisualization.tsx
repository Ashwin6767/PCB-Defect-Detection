import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Radio } from 'lucide-react';

interface RadarVisualizationProps {
  distance: number;
  maxDistance?: number;
}

const RadarVisualization = ({ distance, maxDistance = 400 }: RadarVisualizationProps) => {
  const [animatedDistance, setAnimatedDistance] = useState(distance);
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    setIsPinging(true);
    const timeout = setTimeout(() => setIsPinging(false), 2000);

    // Animate distance change
    const duration = 600;
    const steps = 30;
    const increment = (distance - animatedDistance) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedDistance((prev) => prev + increment);
      } else {
        setAnimatedDistance(distance);
        clearInterval(interval);
      }
    }, duration / steps);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [distance, animatedDistance]);

  const normalizedDistance = Math.min(animatedDistance / maxDistance, 1);
  const angle = normalizedDistance * 90; // 0 to 90 degrees

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Radio className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Distance Sensor</h3>
      </div>

      <div className="relative w-full aspect-square max-w-md mx-auto">
        {/* Radar background circles */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Background circles */}
          <circle cx="100" cy="100" r="25" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="100" cy="100" r="50" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="100" cy="100" r="75" stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.3" />
          
          {/* Radar sweep */}
          <path
            d={`M 100 100 L 100 25 A 75 75 0 0 1 ${100 + 75 * Math.cos((angle - 90) * (Math.PI / 180))} ${
              100 + 75 * Math.sin((angle - 90) * (Math.PI / 180))
            } Z`}
            fill="url(#radarGradient)"
            opacity="0.6"
            className="transition-all duration-700"
          />
        </svg>

        {/* Distance value display */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-3xl font-bold text-foreground">
            {animatedDistance.toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground">cm</div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isPinging ? 'bg-green-500' : 'bg-muted'} transition-colors`} />
        <span className="text-xs text-muted-foreground">
          {distance < 50 ? 'Object Detected' : distance < 200 ? 'Monitoring' : 'Clear'}
        </span>
      </div>
    </Card>
  );
};

export default RadarVisualization;