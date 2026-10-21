// src/app/api/search/autocomplete/route.ts
import { NextResponse } from "next/server";
import { autocompleteParamsSchema } from "@/lib/validations/search";
import { executeAutocomplete } from "@/lib/services/search.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validationResult = autocompleteParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid autocomplete parameters",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { q, limit } = validationResult.data;
    const data = await executeAutocomplete(q, limit);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[API_AUTOCOMPLETE_ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Autocomplete service temporarily unavailable" },
      { status: 500 }
    );
  }
}