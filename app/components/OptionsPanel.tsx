interface Props {
  requireLowCostGem: boolean;
  stratifyCost: boolean;
  onChangeRequireLowCostGem: (next: boolean) => void;
  onChangeStratifyCost: (next: boolean) => void;
}

export function OptionsPanel({
  requireLowCostGem,
  stratifyCost,
  onChangeRequireLowCostGem,
  onChangeStratifyCost,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">オプション</h2>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-slate-700/50">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-emerald-500"
            checked={requireLowCostGem}
            onChange={(e) => onChangeRequireLowCostGem(e.target.checked)}
          />
          <span>
            <span className="block font-medium text-slate-100">
              コスト 3 以下の宝石を 1 枚必ず含める
            </span>
            <span className="block text-xs text-slate-400">
              宝石 3 枚のうち 1 枚はコスト 3 以下、残り 2 枚は宝石プールから抽選されます
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-slate-700/50">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-emerald-500"
            checked={stratifyCost}
            onChange={(e) => onChangeStratifyCost(e.target.checked)}
          />
          <span>
            <span className="block font-medium text-slate-100">
              タイプ別にコストを分散する
            </span>
            <span className="block text-xs text-slate-400">
              タイプごとにプールのコスト範囲 (最小〜最大) を枠数で等分し、各コスト帯から 1 枚ずつ抽選されます。低・中・高のコストが偏らない構成になります
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
