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
    <div className="glass-card p-4 animate-fade-in h-[100px] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <Waves className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">High Tides</span>
      </div>
      
      <div className="flex gap-6">
        {highTides.map((tide, index) => (
          <div key={index} className="text-center">
            <div className="text-base font-semibold text-foreground">{tide.time}</div>
            <div className="text-xs text-muted-foreground">{tide.height}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TideWidget;
