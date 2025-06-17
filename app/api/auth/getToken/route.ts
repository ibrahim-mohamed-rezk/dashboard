import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get('token')?.value;
    const user = request.cookies.get('user')?.value;

    // If token doesn't exist, return unauthorized
    if (!token || !user) {
      return NextResponse.json(
        { error: 'Authentication token not found' },
        { status: 401 }
      );
    }

    // Return the token
    return NextResponse.json({ token, user }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve authentication token' },
      { status: 500 }
    );
  }
}
