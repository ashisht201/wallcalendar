import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
