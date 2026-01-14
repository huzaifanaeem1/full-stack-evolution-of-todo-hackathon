'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task } from '@/src/types';
import { TaskItem } from '@/src/components/TaskItem';
import { taskAPI } from '@/src/services/api';
import { isAuthenticated, getUserId } from '@/src/services/auth';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on initial load
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const task = await taskAPI.getTask(userId, id);
      setTask(task);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token might be expired, redirect to login
        router.push('/login');
      } else if (err.response?.status === 404) {
        setError('Task not found');
      } else {
        setError(err.message || 'Failed to fetch task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTask(updatedTask);
  };

  const handleTaskDeleted = () => {
    router.push('/tasks'); // Redirect to task list after deletion
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Loading task...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Task not found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/tasks')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black pt-20 pb-4 sm:py-8"> {/* Enhanced background with theme colors */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-yellow-400 to-red-500 bg-clip-text text-transparent mb-2">
            Task Details
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            View and manage your task information
          </p>
        </div>

        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/tasks')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm sm:text-base flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tasks
          </button>
        </div>

        {task ? (
          <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              <TaskItem
                task={task}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4">
              <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">Loading Task...</h3>
            <p className="text-gray-500">Please wait while we fetch your task information</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 mb-4 text-gray-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">Task Not Found</h3>
            <p className="text-gray-500 mb-6">The task you're looking for doesn't exist or has been deleted</p>
            <button
              onClick={() => router.push('/tasks')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
            >
              View All Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}