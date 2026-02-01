import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isSameMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useDisplayCalendar } from '@/hooks/useDisplayCalendar';
import ClockWidget from '@/components/ClockWidget';

const eventColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-violet-500',
];

const DisplayView = () => {
  const { code } = useParams<{ code: string }>();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const { events, loading, error } = useDisplayCalendar(code, currentMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const eventColorMap = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((event, index) => {
      if (!map.has(event.id)) {
        map.set(event.id, eventColors[index % eventColors.length]);
      }
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      const eventDay = format(eventStart, 'yyyy-MM-dd');
      const dayString = format(day, 'yyyy-MM-dd');
      return eventDay === dayString;
    });
  };

  const getEventColor = (eventId: string) => {
    return eventColorMap.get(eventId) || eventColors[0];
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (error) {
    return (
      <div className="w-screen min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Display Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            to="/display"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Try a different code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background p-4 flex flex-col overflow-hidden">
      {/* Header with clock */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-48">
          <ClockWidget compact />
        </div>
        
        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold min-w-[280px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="w-48 flex justify-end">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center py-3 text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar body */}
        <div className="flex-1 flex flex-col">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 flex-1 min-h-0">
              {week.map((day) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-b border-border/30 p-2 flex flex-col overflow-hidden ${
                      today ? 'bg-primary/10' : ''
                    } ${!inMonth ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`text-sm font-medium mb-1 ${
                        today
                          ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex-1 overflow-hidden space-y-0.5">
                      {dayEvents.slice(0, 4).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1 rounded-md truncate text-white ${getEventColor(event.id)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="text-xs text-muted-foreground px-2">
                          +{dayEvents.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-xs text-muted-foreground">
        Display Code: <span className="font-mono">{code}</span> • Auto-refreshes every 5 minutes
      </div>
    </div>
  );
};

export default DisplayView;
