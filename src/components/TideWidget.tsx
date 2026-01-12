import { Waves } from 'lucide-react';

interface TideTime {
  time: string;
  height: string;
  type: 'high' | 'low';
}

const TideWidget = () => {
  // Mock tide data for Mumbai - in production, this would call a tide API
  const tides: TideTime[] = [
    { time: '06:42 AM', height: '4.2m', type: 'high' },
    { time: '12:58 PM', height: '1.1m', type: 'low' },
    { time: '07:15 PM', height: '3.9m', type: 'high' },
  ];

  const highTides = tides.filter(t => t.type === 'high');

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Waves className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">High Tides Today</span>
      </div>
      
      <div className="flex gap-4">
        {highTides.map((tide, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="text-lg font-semibold text-foreground">{tide.time}</div>
            <div className="text-xs text-muted-foreground">{tide.height}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TideWidget;
