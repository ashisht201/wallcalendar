import { Check, Circle, RefreshCw } from 'lucide-react';
import { DisplayTask } from '@/hooks/useDisplayTasks';

interface DisplayTodoWidgetProps {
  tasks: DisplayTask[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const DisplayTodoWidget = ({ tasks, loading, error, onRefresh }: DisplayTodoWidgetProps) => {
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          To-Do List
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
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
                className="todo-item py-1"
              >
                <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground text-xs">{task.title}</span>
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
                    className="todo-item py-1 opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground text-xs line-through">{task.title}</span>
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

export default DisplayTodoWidget;
