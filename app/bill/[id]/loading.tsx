export default function BillLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-3/4 rounded bg-[#EDEEEF]" />
        <div className="h-5 w-1/3 rounded bg-[#EDEEEF]" />
      </div>

      {/* Summary skeleton */}
      <div className="card p-6 space-y-3">
        <div className="h-5 w-24 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-full rounded bg-[#EDEEEF]" />
        <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-4/6 rounded bg-[#EDEEEF]" />
      </div>

      {/* Status skeleton */}
      <div className="card p-6 space-y-3">
        <div className="h-5 w-24 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-full rounded bg-[#EDEEEF]" />
        <div className="h-4 w-2/3 rounded bg-[#EDEEEF]" />
      </div>

      {/* Timeline skeleton */}
      <div className="card p-6 space-y-4">
        <div className="h-5 w-24 rounded bg-[#EDEEEF]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-[#EDEEEF] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 rounded bg-[#EDEEEF]" />
              <div className="h-4 w-full rounded bg-[#EDEEEF]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
