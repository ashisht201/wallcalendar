import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isSameMonth, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, LogIn } from 'lucide-react';
import { useGoogleCalendar, CalendarEvent } from '@/hooks/useGoogleCalendar';

interface CalendarWidgetProps {
  isAuthenticated: boolean;
  onSignIn: () => void;
}

const eventColors = [
  'bg-primary',
  'bg-accent',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
];

const CalendarWidget = ({ isAuthenticated, onSignIn }: CalendarWidgetProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, error, needsAuth } = useGoogleCalendar(currentMonth, isAuthenticated);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const dateKey = event.start.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsMap.get(dateKey) || [];
  };

  const getEventColor = (event: CalendarEvent, index: number) => {
    if (event.colorId) {
      const colorIndex = parseInt(event.colorId) % eventColors.length;
      return eventColors[colorIndex];
    }
    return eventColors[index % eventColors.length];
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mr-4"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          )}
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Error/Auth message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
          {needsAuth && (
            <button
              onClick={onSignIn}
              className="ml-2 underline hover:no-underline"
            >
              Sign in again
            </button>
          )}
        </div>
      )}

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-border/30">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              className={`calendar-day ${isDayToday ? 'calendar-day-today' : ''} ${!isCurrentMonth ? 'opacity-30' : ''}`}
            >
              <span className={isDayToday ? 'calendar-day-number-today' : 'calendar-day-number text-muted-foreground'}>
                {format(day, 'd')}
              </span>
              
              <div className="flex-1 w-full overflow-hidden">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={`calendar-event ${getEventColor(event, eventIndex)} text-primary-foreground`}
                    title={`${event.start.includes('T') ? format(parseISO(event.start), 'h:mm a') : 'All day'} - ${event.title}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWidget;
