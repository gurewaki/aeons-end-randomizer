interface Props {
  disabled?: boolean;
  onClick: () => void;
}

export function GenerateButton({ disabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-bold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
    >
      ランダム生成
    </button>
  );
}
