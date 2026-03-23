import Link from "next/link";
import Button from "./components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100">
        404
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Page not found
      </p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}

