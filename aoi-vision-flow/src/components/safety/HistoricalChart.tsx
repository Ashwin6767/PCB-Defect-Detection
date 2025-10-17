import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SensorData } from '@/hooks/useSafetyWebSocket';
import { TrendingUp } from 'lucide-react';

interface HistoricalChartProps {
  data: SensorData[];
}

const HistoricalChart = ({ data }: HistoricalChartProps) => {
  const formattedData = data.map((item, index) => ({
    time: index,
    temperature: item.temperature,
    humidity: item.humidity,
    pressure: item.pressure / 10, // Scale down for better visualization
    airQuality: item.air_quality / 10, // Scale down
  }));

  interface TooltipEntry {
    color: string;
    name: string;
    value: number;
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          {payload.map((entry: TooltipEntry, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-foreground">
                {entry.name}: {entry.value}
                {entry.name.includes('Pressure') ? ' hPa' : 
                 entry.name.includes('Temperature') ? '°C' : 
                 entry.name.includes('Humidity') ? '%' : 
                 entry.name.includes('Air Quality') ? ' PPM' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Historical Data</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
          />
          
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={false}
            fill="url(#tempGradient)"
            fillOpacity={1}
            name="Temperature (°C)"
            animationDuration={500}
          />
          
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="hsl(210, 50%, 70%)"
            strokeWidth={2}
            dot={false}
            name="Humidity (%)"
            animationDuration={500}
          />
          
          <Line
            type="monotone"
            dataKey="pressure"
            stroke="hsl(180, 50%, 60%)"
            strokeWidth={2}
            dot={false}
            name="Pressure (x10 hPa)"
            animationDuration={500}
          />
          
          <Line
            type="monotone"
            dataKey="airQuality"
            stroke="hsl(140, 50%, 60%)"
            strokeWidth={2}
            dot={false}
            name="Air Quality (x10 PPM)"
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default HistoricalChart;