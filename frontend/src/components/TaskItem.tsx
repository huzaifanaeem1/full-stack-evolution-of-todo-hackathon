'use client';

import { useState } from 'react';
import { Task } from '@/src/types';
import { taskAPI } from '@/src/services/api';
import { getUserId } from '@/src/services/auth';

interface TaskItemProps {
  task: Task;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskItem = ({ task, onTaskUpdated, onTaskDeleted }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const updatedTask = await taskAPI.patchTaskCompletion(userId, task.id, {
        is_completed: !task.is_completed
      });

      // Optimistic update - immediately update UI with toggled status
      onTaskUpdated(updatedTask);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const updatedTask = await taskAPI.updateTask(userId, task.id, {
        title: title.trim(),
        description: description.trim(),
        is_completed: task.is_completed
      });

      // Optimistic update - immediately update UI with new task
      onTaskUpdated(updatedTask);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await taskAPI.deleteTask(userId, task.id);

      // Optimistic update - immediately remove task from UI
      onTaskDeleted(task.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isEditing) {
    return (
      <div className="border border-purple-500/30 rounded-xl p-5 mb-4 bg-gradient-to-br from-purple-900/10 to-black/30 backdrop-blur-sm">
        <form onSubmit={handleUpdate}>
          <div className="mb-3">
            <label htmlFor={`title-${task.id}`} className="block text-sm font-medium text-gray-300 mb-1">
              Task Title
            </label>
            <input
              id={`title-${task.id}`}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor={`desc-${task.id}`} className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id={`desc-${task.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm mb-3">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setTitle(task.title);
                setDescription(task.description || '');
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-gradient-to-r from-purple-600 to-yellow-600 text-white hover:from-purple-700 hover:to-yellow-700 shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`border border-purple-500/20 rounded-xl p-5 mb-4 transition-all duration-200 ${
      task.is_completed
        ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30'
        : 'bg-gradient-to-br from-purple-900/5 to-black/20 backdrop-blur-sm'
    }`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={handleToggleComplete}
            disabled={loading}
            className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500 bg-black/30 border-purple-500/30"
          />
        </div>

        <div className="flex-1 min-w-0 ml-4">
          <h3 className={`text-lg font-semibold ${
            task.is_completed
              ? 'line-through text-gray-400'
              : 'text-white'
          }`}>
            {task.title}
          </h3>

          {task.description && (
            <p className={`mt-2 text-gray-400 ${
              task.is_completed ? 'line-through' : ''
            }`}>
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Created: {formatDate(task.created_at)}
            </span>
            {task.updated_at !== task.created_at && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Updated: {formatDate(task.updated_at)}
              </span>
            )}
            {task.is_completed && (
              <span className="flex items-center text-green-400">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-yellow-400 disabled:opacity-50 transition-colors duration-200 rounded-lg hover:bg-black/20"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors duration-200 rounded-lg hover:bg-black/20"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};