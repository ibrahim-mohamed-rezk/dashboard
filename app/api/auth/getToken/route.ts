import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('token')?.value;

    // If token doesn't exist, return unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }

    // Return only the token (user data is stored in localStorage on client)
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve authentication token' },
      { status: 500 }
    );
  }
}
