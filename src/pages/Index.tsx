import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import ClockWidget from '@/components/ClockWidget';
import WeatherWidget from '@/components/WeatherWidget';
import TideWidget from '@/components/TideWidget';
import TodayEventsWidget from '@/components/TodayEventsWidget';
import TodoWidget from '@/components/TodoWidget';
import CalendarWidget from '@/components/CalendarWidget';
import { LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, session, loading, signInWithGoogle, signOut } = useGoogleAuth();

  return (
    <div className="w-screen min-h-screen bg-background p-4 md:p-6 overflow-auto md:overflow-hidden">
      {/* User info bar */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground hidden sm:inline">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Desktop: sidebar left, calendar right */}
      {/* Mobile: calendar on top, widgets below */}
      <div className="h-full flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-4 md:gap-6">
        {/* Widgets - shown below on mobile, left sidebar on desktop */}
        <div className="order-2 lg:order-1 flex flex-col gap-4 md:gap-6">
          {/* On mobile: horizontal scroll for small widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
            <ClockWidget />
            <WeatherWidget />
            <TideWidget />
            <TodayEventsWidget />
          </div>
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <TodoWidget />
          </div>
        </div>
        
        {/* Main calendar area */}
        <div className="order-1 lg:order-2 min-h-[400px] lg:h-full">
          <CalendarWidget 
            isAuthenticated={!!user} 
            onSignIn={signInWithGoogle}
            providerToken={session?.provider_token}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
