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
      <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white">
        <form onSubmit={handleUpdate}>
          <div className="mb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setTitle(task.title);
                setDescription(task.description || '');
              }}
              disabled={loading}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-3 py-1 rounded-md ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 mb-3 ${task.is_completed ? 'bg-green-50' : 'bg-white'}`}>
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={handleToggleComplete}
          disabled={loading}
          className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
        />

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className={`mt-1 text-gray-600 ${task.is_completed ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}

          <div className="mt-2 text-sm text-gray-500">
            <span>Created: {formatDate(task.created_at)}</span>
            {task.updated_at !== task.created_at && (
              <span className="ml-3">Updated: {formatDate(task.updated_at)}</span>
            )}
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};