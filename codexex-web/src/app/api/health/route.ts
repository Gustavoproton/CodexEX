import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", app: "CodexEX", time: new Date().toISOString() });
}
