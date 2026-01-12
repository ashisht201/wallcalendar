import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';

interface TodayEvent {
  time: string;
  name: string;
}

interface TodayEventsWidgetProps {
  events?: Array<{
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
  }>;
  loading?: boolean;
}

const TodayEventsWidget = ({ events = [], loading = false }: TodayEventsWidgetProps) => {
  const today = new Date();
  
  // Filter events for today and format them
  const todayEvents: TodayEvent[] = events
    .filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate.toDateString() === today.toDateString();
    })
    .slice(0, 3) // Show max 3 events
    .map(event => ({
      time: event.start.dateTime 
        ? format(new Date(event.start.dateTime), 'h:mm a')
        : 'All day',
      name: event.summary || 'Untitled',
    }));

  // Mock data if no real events
  const displayEvents = todayEvents.length > 0 ? todayEvents : [
    { time: '9:00 AM', name: 'Team standup' },
    { time: '2:00 PM', name: 'Project review' },
    { time: '5:30 PM', name: 'Gym session' },
  ];

  if (loading) {
    return (
      <div className="glass-card p-4 h-[100px] animate-pulse flex flex-col justify-center">
        <div className="h-4 w-24 bg-secondary rounded mb-2" />
        <div className="space-y-1">
          <div className="h-3 w-full bg-secondary rounded" />
          <div className="h-3 w-3/4 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 animate-fade-in h-[100px] flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Today</span>
      </div>
      
      <div className="flex-1 overflow-hidden space-y-1">
        {displayEvents.map((event, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-16 flex-shrink-0">{event.time}</span>
            <span className="text-foreground truncate">{event.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayEventsWidget;
