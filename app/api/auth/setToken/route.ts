import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  const response = NextResponse.json({ message: "Logged in" });
  
  // Only store token in cookie (user data is stored in localStorage on client)
  if (token) {
    response.cookies.set("token", token, { 
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
  }

  return response;
}
