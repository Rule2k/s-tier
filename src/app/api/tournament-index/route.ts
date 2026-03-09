import { NextResponse } from "next/server";
import { getTournamentIndex } from "@/lib/redis/getTournamentIndex";

export async function GET() {
  try {
    const summaries = await getTournamentIndex();
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Failed to fetch tournament index:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament index" },
      { status: 500 },
    );
  }
}
