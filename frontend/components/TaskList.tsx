'use client';

import { useState } from 'react';
import { Task } from '@/src/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskList = ({ tasks, onTaskUpdated, onTaskDeleted }: TaskListProps) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    // Apply status filter
    if (filter === 'active' && task.is_completed) return false;
    if (filter === 'completed' && !task.is_completed) return false;

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  if (tasks.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No tasks yet. Create your first task!</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Filters and Search */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex space-x-1">
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Task Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No tasks match your filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};