import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  
  // Remove token cookie
  response.cookies.delete("token");
  
  // Remove user cookie (legacy cleanup)
  response.cookies.delete("user");

  return response;
}
