import { NextRequest, NextResponse } from "next/server";
import { fetchBillById } from "../../../lib/mappers/congressToBill";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "119-hr144";
  try {
    console.log(`[debug-bill] Fetching bill: ${id}`);
    const bill = await fetchBillById(id);
    console.log(`[debug-bill] Result:`, bill ? bill.name : "null");
    return NextResponse.json({ found: !!bill, name: bill?.name || null, id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[debug-bill] Error:`, msg);
    return NextResponse.json({ error: msg, id }, { status: 500 });
  }
}
