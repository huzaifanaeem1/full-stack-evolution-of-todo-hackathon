'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/src/types';
import { TaskList } from '@/src/components/TaskList';
import { TaskForm } from '@/src/components/TaskForm';
import { taskAPI } from '@/src/services/api';
import { isAuthenticated, getUserId } from '@/src/services/auth';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication on initial load
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const tasks = await taskAPI.getTasks(userId);
      setTasks(tasks);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token might be expired, redirect to login
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Loading tasks...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black pt-20 pb-4 sm:pb-8"> {/* Enhanced background with theme colors */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-yellow-400 to-red-500 bg-clip-text text-transparent mb-2">
            My Tasks
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage and organize your tasks efficiently
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="text-sm text-gray-400">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm sm:text-base"
          >
            ← Back to Home
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Add New Task</h2>
            <p className="text-gray-400 text-sm mb-4">Create a new task to stay organized</p>
          </div>
          <TaskForm onTaskCreated={handleTaskCreated} />
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="p-4 sm:p-6 border-b border-purple-500/20">
            <h2 className="text-xl font-semibold text-white">Your Tasks</h2>
            <p className="text-gray-400 text-sm">Manage your tasks efficiently</p>
          </div>
          <div className="p-4 sm:p-6">
            <TaskList
              tasks={tasks}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}