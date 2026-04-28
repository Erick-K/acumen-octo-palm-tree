
import React, { useState, useMemo } from 'react';
import type { Task, User } from '../types';
import { TaskForm } from './TaskForm';
import { TrashIcon, WarningIcon } from './icons';

interface TasksProps {
  tasks: Task[];
  salesReps: User[];
  onAddTask: (newTask: Omit<Task, 'id' | 'status'>) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
  userRole: User['role'];
  currentUserId: number;
}

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-600';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
        case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-600';
    }
};

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && !isToday(dueDate);
const isToday = (dueDate: string) => new Date(dueDate).toDateString() === new Date().toDateString();


const DeleteConfirmationModal: React.FC<{
    task: Task;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ task, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/30">
                    <WarningIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                        Delete Task
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this task? <br/> <span className="font-bold">"{task.title}"</span> <br/> This action is permanent.
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    onClick={onConfirm}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                    Confirm Delete
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);


const TaskItem: React.FC<{
    task: Task;
    onStatusChange: (status: Task['status']) => void;
    onDelete: () => void;
    assignee?: string;
}> = ({ task, onStatusChange, onDelete, assignee }) => {
    const isTaskOverdue = isOverdue(task.dueDate) && task.status === 'To-do';
    
    return (
        <div className={`p-4 bg-white border rounded-lg shadow-sm dark:bg-gray-800 ${isTaskOverdue ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <p className={`text-gray-800 dark:text-gray-100 ${task.status === 'Done' ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {task.title}
                    </p>
                    {assignee && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Assigned to: <span className="font-medium">{assignee}</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                     <button
                        onClick={onDelete}
                        className="p-1 text-gray-400 rounded-full hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:ring-offset-gray-800"
                        aria-label={`Delete task ${task.title}`}
                     >
                        <TrashIcon className="w-5 h-5" />
                     </button>
                     <label htmlFor={`task-${task.id}`} className="sr-only">Complete task</label>
                     <input
                        id={`task-${task.id}`}
                        type="checkbox"
                        checked={task.status === 'Done'}
                        onChange={(e) => onStatusChange(e.target.checked ? 'Done' : 'To-do')}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                     />
                </div>
            </div>
             <div className="flex items-center justify-between mt-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
                <span className={`text-sm font-medium ${isTaskOverdue ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    {new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    {isTaskOverdue && ' (Overdue!)'}
                    {isToday(task.dueDate) && task.status === 'To-do' && ' (Today)'}
                </span>
            </div>
        </div>
    );
};

export const Tasks: React.FC<TasksProps> = ({ tasks, salesReps, onAddTask, onUpdateTaskStatus, onDeleteTask, userRole, currentUserId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'All'>('All');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleTaskAdded = (newTaskData: Omit<Task, 'id' | 'status'>) => {
      onAddTask(newTaskData);
      setShowAddForm(false);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
        onDeleteTask(taskToDelete.id);
        setTaskToDelete(null);
    }
  };

  const filteredTasks = useMemo(() => {
      return tasks
          .filter(task => statusFilter === 'All' || task.status === statusFilter)
          .filter(task => priorityFilter === 'All' || task.priority === priorityFilter)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, statusFilter, priorityFilter]);
  
  if (showAddForm) {
      return (
          <div className="p-4 sm:p-6 lg:p-8">
              <TaskForm
                  onAddTask={handleTaskAdded}
                  onCancel={() => setShowAddForm(false)}
                  salesReps={salesReps}
                  userRole={userRole}
                  currentUserId={currentUserId}
              />
          </div>
      );
  }

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-end">
        <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
              <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full h-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                  <option value="All">All</option>
                  <option value="To-do">To-do</option>
                  <option value="Done">Done</option>
              </select>
          </div>
          <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Priority</label>
              <select
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full h-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
              </select>
          </div>
      </div>
      
      <div className="mt-6 space-y-4">
          {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                  <TaskItem
                      key={task.id}
                      task={task}
                      onStatusChange={(newStatus) => onUpdateTaskStatus(task.id, newStatus)}
                      onDelete={() => setTaskToDelete(task)}
                      assignee={userRole === 'Admin' ? salesReps.find(r => r.id === task.assignedToId)?.name : undefined}
                  />
              ))
          ) : (
              <div className="py-12 text-center text-gray-500 border-2 border-dashed rounded-lg dark:border-gray-700">
                  <h3 className="text-sm font-medium">No tasks found</h3>
                  <p className="mt-1 text-sm">No tasks match your current filters.</p>
              </div>
          )}
      </div>
    </div>
    {taskToDelete && (
        <DeleteConfirmationModal
            task={taskToDelete}
            onCancel={() => setTaskToDelete(null)}
            onConfirm={handleConfirmDelete}
        />
    )}
    </>
  );
};
