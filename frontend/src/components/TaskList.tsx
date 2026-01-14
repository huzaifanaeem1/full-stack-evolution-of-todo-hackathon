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
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 mb-6 opacity-50">
          <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-400 mb-2">No tasks yet</h3>
        <p className="text-gray-500 mb-6">Create your first task to get started</p>
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Get Started
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-black/30 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex space-x-2">
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                filter === status
                  ? 'bg-gradient-to-r from-purple-600 to-yellow-600 text-white shadow-lg'
                  : 'bg-black/30 text-gray-400 hover:text-white hover:bg-black/50 border border-purple-500/20'
              }`}
            >
              <span className="capitalize">{status}</span>
              {status === 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded-full">
                  {tasks.length}
                </span>
              )}
              {status === 'active' && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-600/20 text-yellow-300 text-xs rounded-full">
                  {tasks.filter(t => !t.is_completed).length}
                </span>
              )}
              {status === 'completed' && (
                <span className="ml-2 px-2 py-0.5 bg-green-600/20 text-green-300 text-xs rounded-full">
                  {tasks.filter(t => t.is_completed).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-900/20 to-black/30 border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600/20 rounded-lg mr-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tasks.length}</p>
              <p className="text-gray-400 text-sm">Total Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/20 to-black/30 border border-yellow-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-600/20 rounded-lg mr-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tasks.filter(t => !t.is_completed).length}</p>
              <p className="text-gray-400 text-sm">Active Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-black/30 border border-green-500/20 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-600/20 rounded-lg mr-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tasks.filter(t => t.is_completed).length}</p>
              <p className="text-gray-400 text-sm">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 mb-4 text-gray-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">No tasks found</h3>
            <p className="text-gray-500">Try changing your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
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
    </div>
  );
};