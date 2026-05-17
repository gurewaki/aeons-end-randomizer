import type { PlayerValue, TurnOrderSettings } from '../../lib/turnOrder';

const ALL_VALUES: PlayerValue[] = [1, 2, 3, 4];

const VALUE_ACTIVE: Record<PlayerValue, string> = {
  1: 'border-yellow-400 bg-yellow-500/30 text-yellow-100',
  2: 'border-orange-400 bg-orange-500/30 text-orange-100',
  3: 'border-blue-400 bg-blue-500/30 text-blue-100',
  4: 'border-purple-400 bg-purple-500/30 text-purple-100',
};
const VALUE_INACTIVE =
  'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50';

export function TurnOrderSettingsPanel({
  settings,
  onChange,
}: {
  settings: TurnOrderSettings;
  onChange: (next: TurnOrderSettings) => void;
}) {
  const { playerValues, useDoomCard } = settings;
  const count = playerValues.length;

  const toggleValue = (v: PlayerValue) => {
    const has = playerValues.includes(v);
    let next: PlayerValue[];
    if (has) {
      if (count <= 2) return; // 最低2人必要
      next = playerValues.filter((x) => x !== v);
    } else {
      if (count >= 4) return;
      next = [...playerValues, v].sort((a, b) => a - b) as PlayerValue[];
    }
    onChange({ ...settings, playerValues: next });
  };

  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-100">
          プレイヤー値
          <span className="ml-2 text-sm font-normal text-slate-400">
            {count} 人プレイ
            {count === 3 && ' (ワイルドカード自動追加)'}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_VALUES.map((v) => {
            const active = playerValues.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleValue(v)}
                className={`h-12 w-12 rounded border-2 text-xl font-bold transition ${
                  active ? VALUE_ACTIVE[v] : VALUE_INACTIVE
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          2〜4 個選択。3 個ならワイルドカードを自動追加します
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={useDoomCard}
          onChange={(e) =>
            onChange({ ...settings, useDoomCard: e.target.checked })
          }
          className="h-4 w-4 rounded border-slate-600 bg-slate-900"
        />
        ネメシスカードの 2 枚目を急襲カードに置き換える
      </label>
    </section>
  );
}
