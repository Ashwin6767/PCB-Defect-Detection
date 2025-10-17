import { useState } from 'react';
import { Thermometer, Droplets, Gauge, Wind, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConnectionStatus from '@/components/safety/ConnectionStatus';
import RadialGauge from '@/components/safety/RadialGauge';
import MetricCard from '@/components/safety/MetricCard';
import RadarVisualization from '@/components/safety/RadarVisualization';
import HistoricalChart from '@/components/safety/HistoricalChart';
import { useSafetyWebSocket } from '@/hooks/useSafetyWebSocket';

const SafetyMonitor = () => {
  const [arduinoIP, setArduinoIP] = useState('192.168.1.100');
  const [inputIP, setInputIP] = useState('192.168.1.100');
  const { isConnected, sensorData, historicalData } = useSafetyWebSocket(arduinoIP);

  // Default values for when no data is available
  const temperature = sensorData?.temperature ?? 22.5;
  const humidity = sensorData?.humidity ?? 45.0;
  const distance = sensorData?.distance ?? 150;
  const pressure = sensorData?.pressure ?? 1013.2;
  const airQuality = sensorData?.air_quality ?? 285;

  const handleIPUpdate = () => {
    setArduinoIP(inputIP);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-black p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2 tracking-tight">
              HALO Safety Monitor
            </h1>
            <p className="text-slate-400">Real-time environmental monitoring system</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus isConnected={isConnected} ip={arduinoIP} />
          </div>
        </div>
      </header>

      {/* Arduino IP Configuration */}
      <Card className="mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-blue-900/30 border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">Arduino Configuration</h3>
        </div>
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Arduino IP Address"
            value={inputIP}
            onChange={(e) => setInputIP(e.target.value)}
            className="max-w-xs bg-slate-800/50 border-slate-600 text-slate-200"
          />
          <Button 
            onClick={handleIPUpdate}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            Connect
          </Button>
        </div>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Temperature Gauge */}
        <RadialGauge
          title="Temperature"
          value={temperature}
          unit="°C"
          maxValue={50}
          icon={<Thermometer className="w-5 h-5" />}
          color="hsl(220, 100%, 60%)"
        />

        {/* Humidity Gauge */}
        <RadialGauge
          title="Humidity"
          value={humidity}
          unit="%"
          maxValue={100}
          icon={<Droplets className="w-5 h-5" />}
          color="hsl(210, 50%, 70%)"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MetricCard
          title="Atmospheric Pressure"
          value={pressure}
          unit="hPa"
          icon={<Gauge className="w-5 h-5" />}
          subtitle="Standard atmospheric pressure"
        />
        <MetricCard
          title="Air Quality"
          value={airQuality}
          unit="PPM"
          icon={<Wind className="w-5 h-5" />}
          subtitle={airQuality < 300 ? 'Good' : airQuality < 500 ? 'Moderate' : 'Poor'}
        />
      </div>

      {/* Distance Radar */}
      <div className="mb-6">
        <RadarVisualization distance={distance} maxDistance={400} />
      </div>

      {/* Historical Chart */}
      {historicalData.length > 0 && (
        <div>
          <HistoricalChart data={historicalData} />
        </div>
      )}

      {/* Demo Mode Notice */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="text-sm font-medium">Demo Mode - Connect Arduino to see live data</p>
        </div>
      )}
    </div>
  );
};

export default SafetyMonitor;