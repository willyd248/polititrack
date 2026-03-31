import Link from "next/link";
import Button from "./components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <p className="font-headline text-6xl font-bold text-[#C5C6CF]">404</p>
      <h1 className="font-headline text-2xl font-bold text-[#041534]">Page not found</h1>
      <p className="text-sm text-[#75777F] max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="primary" size="md">Go Home</Button>
      </Link>
    </div>
  );
}
