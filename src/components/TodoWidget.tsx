import { useState } from 'react';
import { Check, Circle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const TodoWidget = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Review quarterly report', completed: false },
    { id: '2', text: 'Team standup at 10am', completed: true },
    { id: '3', text: 'Prepare presentation slides', completed: false },
    { id: '4', text: 'Call with client', completed: false },
    { id: '5', text: 'Update project timeline', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        { id: Date.now().toString(), text: newTodo.trim(), completed: false }
      ]);
      setNewTodo('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="glass-card p-6 animate-fade-in h-full flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        To-Do List
      </h3>
      
      <div className="flex gap-2 mb-4">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add new task..."
          className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={addTodo}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto space-y-1">
        {incompleteTodos.map(todo => (
          <div
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className="todo-item cursor-pointer group"
          >
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-foreground">{todo.text}</span>
          </div>
        ))}
        
        {completedTodos.length > 0 && (
          <>
            <div className="text-xs text-muted-foreground uppercase tracking-wider pt-4 pb-2">
              Completed
            </div>
            {completedTodos.map(todo => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="todo-item cursor-pointer opacity-50"
              >
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground line-through">{todo.text}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
