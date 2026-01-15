import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DisplayEntry = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-character code');
      return;
    }
    navigate(`/display/${cleanCode}`);
  };

  return (
    <div className="w-screen min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md text-center">
        <Monitor className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Display Mode</h1>
        <p className="text-muted-foreground mb-6">
          Enter your 6-character access code to view your calendar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="ABC123"
            className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
            maxLength={6}
            autoFocus
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" size="lg">
            View Calendar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Get your access code by signing in on another device and clicking the display icon.
        </p>
      </div>
    </div>
  );
};

export default DisplayEntry;
