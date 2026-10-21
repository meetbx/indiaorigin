// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { searchParamsSchema } from "@/lib/validations/search";
import { executeProductSearch } from "@/lib/services/search.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validationResult = searchParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search parameters",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = await executeProductSearch(validationResult.data);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[API_SEARCH_ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Search service temporarily unavailable" },
      { status: 500 }
    );
  }
}