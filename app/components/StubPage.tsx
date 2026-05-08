export function StubPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center text-sm text-slate-400">
        準備中です。近いうちに実装されます。
      </div>
    </main>
  );
}
