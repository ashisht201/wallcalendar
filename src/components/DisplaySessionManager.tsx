import { useState } from 'react';
import { Monitor, Plus, Trash2, XCircle, Copy, Check } from 'lucide-react';
import { useDisplaySessions, DisplaySession } from '@/hooks/useDisplaySessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface DisplaySessionManagerProps {
  userId: string | undefined;
}

const DisplaySessionManager = ({ userId }: DisplaySessionManagerProps) => {
  const { sessions, loading, createSession, revokeSession, deleteSession } = useDisplaySessions(userId);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateSession = async () => {
    setIsCreating(true);
    await createSession(newDisplayName || undefined);
    setNewDisplayName('');
    setIsCreating(false);
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyUrl = async (code: string) => {
    const url = `${window.location.origin}/display/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeSessions = sessions.filter(s => s.is_active);
  const inactiveSessions = sessions.filter(s => !s.is_active);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
          title="Manage Displays"
        >
          <Monitor className="w-4 h-4 text-muted-foreground" />
          {activeSessions.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {activeSessions.length}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Mode
          </DialogTitle>
          <DialogDescription>
            Create access codes to view your calendar on permanent displays without signing in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new display */}
          <div className="flex gap-2">
            <Input
              placeholder="Display name (optional)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateSession} disabled={isCreating}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Active Displays</h4>
              {activeSessions.map((session) => (
                <DisplaySessionCard
                  key={session.id}
                  session={session}
                  copiedCode={copiedCode}
                  onCopyCode={handleCopyCode}
                  onCopyUrl={handleCopyUrl}
                  onRevoke={revokeSession}
                  onDelete={deleteSession}
                />
              ))}
            </div>
          )}

          {/* Inactive sessions */}
          {inactiveSessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Revoked Displays</h4>
              {inactiveSessions.map((session) => (
                <DisplaySessionCard
                  key={session.id}
                  session={session}
                  copiedCode={copiedCode}
                  onCopyCode={handleCopyCode}
                  onCopyUrl={handleCopyUrl}
                  onRevoke={revokeSession}
                  onDelete={deleteSession}
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No displays configured yet. Create one to get started!
            </p>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <p className="font-medium mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a display code above</li>
              <li>On your display device, go to <code className="bg-secondary px-1 rounded">/display</code></li>
              <li>Enter the 6-character code</li>
              <li>Your calendar will appear and auto-refresh</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface DisplaySessionCardProps {
  session: DisplaySession;
  copiedCode: string | null;
  onCopyCode: (code: string) => void;
  onCopyUrl: (code: string) => void;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}

const DisplaySessionCard = ({
  session,
  copiedCode,
  onCopyCode,
  onCopyUrl,
  onRevoke,
  onDelete,
}: DisplaySessionCardProps) => {
  const isCopied = copiedCode === session.access_code;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        session.is_active
          ? 'bg-secondary/30 border-border'
          : 'bg-muted/20 border-border/50 opacity-60'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-lg font-mono font-bold tracking-wider">
            {session.access_code}
          </code>
          <button
            onClick={() => onCopyCode(session.access_code)}
            className="p-1 hover:bg-secondary rounded"
            title="Copy code"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {session.name || 'Unnamed display'}
          {session.last_accessed_at && (
            <span className="ml-2">
              • Last used {format(new Date(session.last_accessed_at), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {session.is_active ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(session.id)}
            title="Revoke access"
          >
            <XCircle className="w-4 h-4 text-destructive" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(session.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DisplaySessionManager;
