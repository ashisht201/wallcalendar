import ClockWidget from '@/components/ClockWidget';
import WeatherWidget from '@/components/WeatherWidget';
import TodoWidget from '@/components/TodoWidget';
import CalendarWidget from '@/components/CalendarWidget';

const Index = () => {
  return (
    <div className="w-screen h-screen bg-background p-6 overflow-hidden">
      <div className="h-full grid grid-cols-[320px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="flex flex-col gap-6">
          <ClockWidget />
          <WeatherWidget />
          <div className="flex-1 min-h-0">
            <TodoWidget />
          </div>
        </div>
        
        {/* Main calendar area */}
        <div className="h-full">
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
};

export default Index;
