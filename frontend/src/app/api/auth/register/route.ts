import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the registration data from the request body
    const body = await request.json();

    // Forward the registration request to the backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8001'}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response data from the backend
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Return the error from the backend
      return NextResponse.json(
        { error: data.detail || 'Registration failed' },
        { status: backendResponse.status }
      );
    }

    // Return the registered user data
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}