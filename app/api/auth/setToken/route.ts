import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, user } = body;

  const response = NextResponse.json({ message: "Logged in" });
  if (token) response.cookies.set("token", token, { maxAge: 60 * 60 });
  if (user)
    response.cookies.set("user", user, {
      maxAge: 60 * 60 * 24,
    });

  return response;
}
