import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

// Proxy API route to backend for individual task operations
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;

    // Extract user ID from URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('jwt_token')?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    // Remove trailing /api if it exists to avoid double /api/api
    const cleanBackendUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
    const response = await fetch(`${cleanBackendUrl}/api/${userId}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;

    // Extract user ID from URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('jwt_token')?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    // Remove trailing /api if it exists to avoid double /api/api
    const cleanBackendUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
    const response = await fetch(`${cleanBackendUrl}/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;

    // Extract user ID from URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('jwt_token')?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    // Remove trailing /api if it exists to avoid double /api/api
    const cleanBackendUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
    const response = await fetch(`${cleanBackendUrl}/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}