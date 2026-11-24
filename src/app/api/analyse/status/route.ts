import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/vision/config";

/** Reports whether a vision provider is configured. Never returns keys or URLs. */
export async function GET() {
  await connection(); // read env at request time, not build time
  return NextResponse.json(getProviderStatus(), { headers: { "Cache-Control": "no-store" } });
}
