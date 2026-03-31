export default function PoliticianLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-[#EDEEEF]" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 rounded bg-[#EDEEEF]" />
            <div className="h-4 w-32 rounded bg-[#EDEEEF]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded bg-[#EDEEEF]" />
          <div className="h-16 rounded bg-[#EDEEEF]" />
          <div className="h-16 rounded bg-[#EDEEEF]" />
        </div>
      </div>

      {/* Key Takeaways skeleton */}
      <div className="card p-6 space-y-3">
        <div className="h-5 w-32 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-full rounded bg-[#EDEEEF]" />
        <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
        <div className="h-4 w-4/6 rounded bg-[#EDEEEF]" />
      </div>

      {/* Modules skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-6 space-y-3">
          <div className="h-5 w-24 rounded bg-[#EDEEEF]" />
          <div className="h-4 w-full rounded bg-[#EDEEEF]" />
          <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
        </div>
      ))}
    </div>
  );
}
