import { NextRequest, NextResponse } from "next/server";
import { parseBillId } from "../../../lib/mappers/congressToBill";
import { congressFetch } from "../../../lib/congress";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "119-hr144";

  // Step 1: Parse the bill ID
  const parsed = parseBillId(id);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid bill ID format", id });
  }

  const { congress, type, number } = parsed;
  const path = `/bill/${congress}/${type.toLowerCase()}/${number}`;

  // Step 2: Fetch from Congress.gov directly
  try {
    const response = await congressFetch<Record<string, unknown>>(path, {
      revalidate: 1800,
    });
    const bill = response.bill;
    return NextResponse.json({
      id,
      parsed: { congress, type, number },
      path,
      hasResponse: !!response,
      responseKeys: Object.keys(response),
      hasBill: !!bill,
      billType: typeof bill,
      billKeys: bill && typeof bill === "object" ? Object.keys(bill as object).slice(0, 10) : null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, id, parsed, path }, { status: 500 });
  }
}
