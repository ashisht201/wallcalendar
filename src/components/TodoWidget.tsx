import { useState } from 'react';
import { Check, Circle, Plus, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGoogleTasks, GoogleTask } from '@/hooks/useGoogleTasks';

interface TodoWidgetProps {
  isAuthenticated: boolean;
  providerToken?: string | null;
}

const TodoWidget = ({ isAuthenticated, providerToken }: TodoWidgetProps) => {
  const { tasks, loading, error, toggleTask, createTask, refetch } = useGoogleTasks(
    isAuthenticated,
    providerToken
  );
  const [newTodo, setNewTodo] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleToggle = async (task: GoogleTask) => {
    await toggleTask(task.id, task.completed);
  };

  const handleAddTodo = async () => {
    if (newTodo.trim() && isAuthenticated) {
      setIsCreating(true);
      await createTask(newTodo.trim());
      setNewTodo('');
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (!isAuthenticated) {
    return (
      <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          To-Do List
        </h3>
        <p className="text-sm text-muted-foreground">Sign in with Google to see your tasks</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          To-Do List
        </h3>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add new task..."
          disabled={isCreating}
          className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleAddTodo}
          disabled={isCreating || !newTodo.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}
      
      <div className="flex-1 overflow-auto space-y-1">
        {loading && tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : incompleteTasks.length === 0 && completedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        ) : (
          <>
            {incompleteTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggle(task)}
                className="todo-item cursor-pointer group"
              >
                <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                <span className="text-foreground">{task.title}</span>
              </div>
            ))}
            
            {completedTasks.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground uppercase tracking-wider pt-4 pb-2">
                  Completed
                </div>
                {completedTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleToggle(task)}
                    className="todo-item cursor-pointer opacity-50"
                  >
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground line-through">{task.title}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
