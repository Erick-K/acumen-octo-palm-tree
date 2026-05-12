
import React, { useState } from 'react';
import type { Task, User } from '../types';

interface TaskFormProps {
  onAddTask: (newTask: Omit<Task, 'id' | 'status'>) => void;
  onCancel: () => void;
  salesReps: User[];
  userRole: User['role'];
  currentUserId: number;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAddTask, onCancel, salesReps, userRole, currentUserId }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [assignedToId, setAssignedToId] = useState<number>(currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      alert('Title and due date are required.');
      return;
    }
    onAddTask({
      title,
      dueDate,
      priority,
      assignedToId: userRole === 'Admin' ? assignedToId : currentUserId,
    });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Add New Task</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="input-field"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        {userRole === 'Admin' && (
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
            <select
              id="assignedTo"
              value={assignedToId}
              onChange={(e) => setAssignedToId(Number(e.target.value))}
              className="input-field"
            >
              {salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                  {rep.workLocation?.town && rep.workLocation?.county
                    ? ` — ${rep.workLocation.town}, ${rep.workLocation.county}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">Save Task</button>
        </div>
      </form>
       <style>{`
        .input-field {
            display: block;
            width: 100%;
            padding: 0.5rem 0.75rem;
            margin-top: 0.25rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            color: #111827;
            background-color: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .dark .input-field {
            color: #ffffff;
            background-color: #374151;
            border-color: #4b5563;
        }
        .input-field:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #eab308;
            box-shadow: 0 0 0 2px #eab308;
        }
        .input-field[type="date"]::-webkit-calendar-picker-indicator,
        .input-field[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(0.5);
        }
        .dark .input-field[type="date"]::-webkit-calendar-picker-indicator,
        .dark .input-field[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
        }
    `}</style>
    </div>
  );
};
