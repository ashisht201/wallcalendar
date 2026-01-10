import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
}

const CalendarWidget = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Mock events - in production, these would come from Google Calendar
  const events: CalendarEvent[] = [
    { id: '1', title: 'Team Meeting', date: new Date(2026, 0, 10, 10, 0), color: 'bg-primary' },
    { id: '2', title: 'Project Review', date: new Date(2026, 0, 10, 14, 0), color: 'bg-accent' },
    { id: '3', title: 'Client Call', date: new Date(2026, 0, 12, 11, 0), color: 'bg-primary' },
    { id: '4', title: 'Lunch with Sarah', date: new Date(2026, 0, 15, 12, 30), color: 'bg-accent' },
    { id: '5', title: 'Sprint Planning', date: new Date(2026, 0, 17, 9, 0), color: 'bg-primary' },
    { id: '6', title: 'Design Review', date: new Date(2026, 0, 20, 15, 0), color: 'bg-accent' },
    { id: '7', title: 'Team Offsite', date: new Date(2026, 0, 22, 9, 0), color: 'bg-primary' },
    { id: '8', title: 'Quarterly Review', date: new Date(2026, 0, 28, 10, 0), color: 'bg-accent' },
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
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
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`calendar-event ${event.color} text-primary-foreground`}
                    title={`${format(event.date, 'h:mm a')} - ${event.title}`}
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
