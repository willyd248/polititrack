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
    bill = await fetchBillById(id);
    if (!bill) {
      // Fallback to mock data
      bill = bills.find((b) => b.id === id) || null;
      useMockData = true;
    }
  } catch (error) {
    // Fallback to mock data
    console.warn(`Failed to fetch bill ${id}, trying mock data:`, error);
    bill = bills.find((b) => b.id === id) || null;
    useMockData = true;
  }
  
  if (!bill) {
    notFound();
  }
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillPageClient bill={bill} useMockData={useMockData} />
    </Suspense>
  );
}

