import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClockWidgetProps {
  compact?: boolean;
}

const ClockWidget = ({ compact = false }: ClockWidgetProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="time-display text-2xl font-light text-primary">
          {format(time, 'HH:mm')}
        </div>
        <div className="text-sm text-muted-foreground">
          {format(time, 'EEE, MMM d')}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 animate-fade-in h-[100px] flex flex-col justify-center">
      <div className="flex items-baseline gap-2">
        <div className="time-display text-3xl font-light text-primary">
          {format(time, 'HH:mm')}
        </div>
        <div className="text-sm text-muted-foreground">
          {format(time, 'EEEE')}
        </div>
      </div>
      <div className="text-base font-medium text-foreground">
        {format(time, 'MMMM d, yyyy')}
      </div>
    </div>
  );
};

export default ClockWidget;
