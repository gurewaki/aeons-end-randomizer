interface Props {
  message: string | null;
}

export function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-500/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
    >
      {message}
    </div>
  );
}
