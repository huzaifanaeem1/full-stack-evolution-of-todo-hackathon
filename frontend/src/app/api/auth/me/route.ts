import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Forward the request to the backend API with the token
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8001'}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response data from the backend
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Return the error from the backend
      return NextResponse.json(
        { error: data.detail || 'Failed to get user profile' },
        { status: backendResponse.status }
      );
    }

    // Return the user data
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching user profile' },
      { status: 500 }
    );
  }
}