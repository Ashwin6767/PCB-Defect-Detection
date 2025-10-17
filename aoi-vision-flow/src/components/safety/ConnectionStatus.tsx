import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  isConnected: boolean;
  ip?: string;
}

const ConnectionStatus = ({ isConnected, ip }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-1"
      >
        <div 
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`}
        />
        {isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
      {ip && (
        <span className="text-sm text-muted-foreground">
          Arduino: {ip}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;