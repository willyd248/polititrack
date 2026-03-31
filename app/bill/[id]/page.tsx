import { fetchBillById } from "../../../lib/mappers/congressToBill";
import { bills } from "../../../data/bills";
import { Bill } from "../../../data/bills";
import { notFound } from "next/navigation";
import BillPageClient from "./page-client";
import { Suspense } from "react";

/**
 * Server component that fetches bill data and passes it to client component
 */
export default async function BillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Try to fetch real bill, fallback to mock data if API is unavailable
  let bill: Bill | null = null;
  let useMockData = false;
  
  try {
    console.log(`[BillPage] Fetching bill: ${id}`);
    bill = await fetchBillById(id);
    console.log(`[BillPage] fetchBillById result:`, bill ? `found: ${bill.name}` : "null");
    if (!bill) {
      // Fallback to mock data
      bill = bills.find((b) => b.id === id) || null;
      if (bill) useMockData = true;
      console.log(`[BillPage] Mock data fallback:`, bill ? `found: ${bill.name}` : "not found");
    }
  } catch (error) {
    // Fallback to mock data
    console.error(`[BillPage] Error fetching bill ${id}:`, error);
    bill = bills.find((b) => b.id === id) || null;
    if (bill) useMockData = true;
  }
  
  if (!bill) {
    notFound();
  }
  
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-2/3 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-1/3 rounded bg-[#EDEEEF]" />
        <div className="card p-6 space-y-3">
          <div className="h-4 w-full rounded bg-[#EDEEEF]" />
          <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
          <div className="h-4 w-4/6 rounded bg-[#EDEEEF]" />
        </div>
      </div>
    }>
      <BillPageClient bill={bill} useMockData={useMockData} />
    </Suspense>
  );
}

