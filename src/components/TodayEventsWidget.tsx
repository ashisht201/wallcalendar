import { CalendarClock } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';

interface TodayEvent {
  time: string;
  name: string;
}

interface TodayEventsWidgetProps {
  events?: CalendarEvent[];
  loading?: boolean;
}

const TodayEventsWidget = ({ events = [], loading = false }: TodayEventsWidgetProps) => {
  // Filter events for today and format them
  const todayEvents: TodayEvent[] = events
    .filter(event => {
      try {
        const eventDate = parseISO(event.start);
        return isToday(eventDate);
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3) // Show max 3 events
    .map(event => ({
      time: format(parseISO(event.start), 'h:mm a'),
      name: event.title || 'Untitled',
    }));

  // Show placeholder message when no events
  const hasEvents = todayEvents.length > 0;

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
        {hasEvents ? (
          todayEvents.map((event, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-16 flex-shrink-0">{event.time}</span>
              <span className="text-foreground truncate">{event.name}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No events scheduled</p>
        )}
      </div>
    </div>
  );
};

export default TodayEventsWidget;
