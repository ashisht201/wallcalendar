import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import ClockWidget from '@/components/ClockWidget';
import WeatherWidget from '@/components/WeatherWidget';
import TodoWidget from '@/components/TodoWidget';
import CalendarWidget from '@/components/CalendarWidget';
import { LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, loading, signInWithGoogle, signOut } = useGoogleAuth();

  return (
    <div className="w-screen h-screen bg-background p-6 overflow-hidden">
      {/* User info bar */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{user.email}</span>
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
          <CalendarWidget 
            isAuthenticated={!!user} 
            onSignIn={signInWithGoogle}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
