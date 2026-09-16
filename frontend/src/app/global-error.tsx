"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-extrabold">GymTracker hit an unexpected error</h1>
            <p className="mt-3 text-zinc-400">Your data was not changed. Try loading the application again.</p>
            <button type="button" onClick={reset} className="mt-7 min-h-11 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950">
              Reload application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
