import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isSameMonth, parseISO, addWeeks, subWeeks, getMonth } from 'date-fns';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useDisplayCalendar } from '@/hooks/useDisplayCalendar';
import { useDisplayTasks } from '@/hooks/useDisplayTasks';
import ClockWidget from '@/components/ClockWidget';
import WeatherWidget from '@/components/WeatherWidget';
import TideWidget from '@/components/TideWidget';
import TodayEventsWidget from '@/components/TodayEventsWidget';
import DisplayTodoWidget from '@/components/DisplayTodoWidget';

const TOTAL_ROWS = 6;
const TODAY_ROW = 1; // 0-indexed, so 2nd row

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

  // Calculate rolling weeks: today's week is row index 1 (2nd row)
  const today = new Date();
  const todayWeekStart = startOfWeek(today);
  const firstWeekStart = subWeeks(todayWeekStart, TODAY_ROW);
  const lastWeekStart = addWeeks(firstWeekStart, TOTAL_ROWS - 1);
  const lastWeekEnd = endOfWeek(lastWeekStart);

  // We need events spanning the entire visible range
  const rangeStart = firstWeekStart;
  const rangeEnd = lastWeekEnd;

  const { events, loading, error } = useDisplayCalendar(code, rangeStart, rangeEnd);
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useDisplayTasks(code);

  // Build the weeks array
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const weekStart = addWeeks(firstWeekStart, i);
      const weekEnd = endOfWeek(weekStart);
      result.push(eachDayOfInterval({ start: weekStart, end: weekEnd }));
    }
    return result;
  }, [firstWeekStart]);

  // Detect month boundaries for labels
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      // Find the first day that belongs to a new month in this week
      for (const day of week) {
        const m = getMonth(day);
        if (m !== lastMonth) {
          // Only label if this day is within the first 7 days of its month (i.e. the month starts in this week)
          if (day.getDate() <= 7) {
            labels.push({ weekIndex, label: format(day, 'MMMM yyyy') });
          }
          lastMonth = m;
          break;
        }
      }
    });
    return labels;
  }, [weeks]);

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

  // Find which months are visible for the header
  const visibleMonths = useMemo(() => {
    const months = new Set<string>();
    weeks.forEach(week => {
      week.forEach(day => {
        months.add(format(day, 'MMMM yyyy'));
      });
    });
    return Array.from(months);
  }, [weeks]);

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
    <div className="w-screen h-screen bg-background p-4 flex overflow-hidden">
      {/* Left sidebar with widgets */}
      <div className="w-[20%] flex flex-col gap-4 mr-4 flex-shrink-0">
        <ClockWidget />
        <WeatherWidget />
        <TideWidget />
        <TodayEventsWidget events={events} loading={loading} />
        <div className="flex-1 min-h-0">
          <DisplayTodoWidget 
            tasks={tasks} 
            loading={tasksLoading} 
            error={tasksError} 
            onRefresh={refetchTasks} 
          />
        </div>
      </div>

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">
            {visibleMonths.join(' — ')}
          </h1>
          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground font-mono">{code}</span>
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
            {weeks.map((week, weekIndex) => {
              // Check if a month label should appear before this week
              const monthLabel = monthLabels.find(ml => ml.weekIndex === weekIndex);

              return (
                <div key={weekIndex} className="flex flex-col flex-1 min-h-0">
                  {/* Month separator/label */}
                  {monthLabel && weekIndex > 0 && (
                    <div className="flex items-center gap-3 px-3 py-1 border-t-2 border-primary/30">
                      <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                        {monthLabel.label}
                      </span>
                      <div className="flex-1 h-px bg-primary/20" />
                    </div>
                  )}
                  <div className="grid grid-cols-7 flex-1 min-h-0">
                    {week.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const dayToday = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r border-b border-border/30 p-2 flex flex-col overflow-hidden ${
                            dayToday ? 'bg-primary/10' : ''
                          }`}
                        >
                          <span
                            className={`text-sm font-medium mb-1 ${
                              dayToday
                                ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                                : day.getDate() === 1
                                  ? 'text-primary font-bold'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {day.getDate() === 1 ? format(day, 'd MMM') : format(day, 'd')}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayView;
