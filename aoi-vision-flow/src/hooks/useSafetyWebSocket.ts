import { useEffect, useState } from 'react';

export interface SensorData {
  temperature: number;
  humidity: number;
  distance: number;
  pressure: number;
  air_quality: number;
  timestamp?: number;
}

export const useSafetyWebSocket = (ip: string = 'localhost', port: number = 8001) => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);

  useEffect(() => {
    if (!ip) return;

    const connectToSafety = async () => {
      try {
        const response = await fetch(`http://${ip}:${port}/api/safety/status`);
        if (response.ok) {
          setIsConnected(true);
          // Start polling for data
          const interval = setInterval(async () => {
            try {
              const dataResponse = await fetch(`http://${ip}:${port}/api/safety/data`);
              if (dataResponse.ok) {
                const data = await dataResponse.json();
                setSensorData(data);
                setHistoricalData(prev => {
                  const updated = [...prev, data];
                  return updated.slice(-100); // Keep last 100 readings
                });
              }
            } catch (error) {
              console.log('Data fetch error:', error);
            }
          }, 1000);

          return () => clearInterval(interval);
        }
      } catch (error) {
        console.log('Connection error:', error);
        setIsConnected(false);
      }
    };

    connectToSafety();
  }, [ip, port]);

  const setArduinoIP = (newIP: string) => {
    setSensorData(null);
    setHistoricalData([]);
    setIsConnected(false);
    // Re-trigger connection with new IP
  };

  return {
    isConnected,
    sensorData,
    historicalData,
    setArduinoIP
  };
};