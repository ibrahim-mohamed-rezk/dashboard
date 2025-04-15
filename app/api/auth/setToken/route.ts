import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  const response = NextResponse.json({ message: "Logged in" });
  response.cookies.set("token", token, {
    maxAge: 60 * 60 ,
  });

  return response;
}
