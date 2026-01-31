import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the login credentials from the request body
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward the login request to the backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8001'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Get the response data from the backend
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Return the error from the backend
      return NextResponse.json(
        { error: data.detail || 'Login failed' },
        { status: backendResponse.status }
      );
    }

    // Extract token and user from the backend response
    const { user, token } = data;

    // Optionally, you can set the token as a cookie here if needed
    // cookies().set('auth_token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 60 * 60 * 24 * 7, // 1 week
    //   path: '/',
    // });

    // Return the user and token to the frontend
    return NextResponse.json({ user, token }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}