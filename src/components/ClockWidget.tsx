import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="time-display text-5xl font-light text-primary mb-2">
        {format(time, 'HH:mm')}
        <span className="text-2xl text-primary/60">{format(time, ':ss')}</span>
      </div>
      <div className="text-lg text-muted-foreground">
        {format(time, 'EEEE')}
      </div>
      <div className="text-2xl font-medium text-foreground">
        {format(time, 'MMMM d, yyyy')}
      </div>
    </div>
  );
};

export default ClockWidget;
