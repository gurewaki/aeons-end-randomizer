import { Fragment } from 'react';
import type { Nemesis } from '../../lib/types';
import { PackageBadge } from './PackageBadge';
import { NemesisCardSections } from './NemesisCardSections';
import { RuleText } from './RuleText';

/**
 * ネメシスのヘッダ + ルール + 固有カードを表示する詳細ビュー。
 * Modal 内で使う想定 (閉じる導線は呼び出し元が用意する)。
 */
export function NemesisDetail({
  nemesis,
  titleId,
  onClose,
  hideExpeditionRule = false,
}: {
  nemesis: Nemesis;
  titleId?: string;
  onClose?: () => void;
  /** 通常モードのランダマイザ等、探索行ルールを表示したくない場合に true */
  hideExpeditionRule?: boolean;
}) {
  // 通常モード共通のテキストフィールドをラベル順に表示
  const ruleSections: { label: string; text: string | undefined }[] = [
    { label: 'ゲーム準備', text: nemesis.setup },
    { label: '追加ルール', text: nemesis.additionalRules },
    { label: '暴走効果', text: nemesis.unleash },
    { label: '難化ルール', text: nemesis.increasedDifficulty },
  ];

  return (
    <div className="space-y-6">
      {onClose && (
        <div className="-mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-base leading-none text-slate-200 hover:bg-slate-700/70"
          >
            ×
          </button>
        </div>
      )}

      <article className="rounded-lg border border-amber-700/70 bg-stone-900/40 p-6 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <PackageBadge expansionId={nemesis.expansionId} />
          {nemesis.level !== undefined && (
            <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
              難易度 {nemesis.level}
            </span>
          )}
          <span className="rounded border border-slate-600 bg-slate-700/40 px-2 py-0.5">
            バトル {nemesis.battle}
          </span>
          {nemesis.life !== undefined && (
            <span className="rounded border border-red-500/60 bg-red-500/20 px-2 py-0.5 text-red-200">
              体力 {nemesis.life}
            </span>
          )}
        </div>
        <h2
          id={titleId}
          className="text-3xl font-bold text-slate-50 sm:text-4xl"
        >
          {nemesis.name}
        </h2>
      </article>

      {ruleSections.some((s) => s.text) && (
        <div className="space-y-4">
          {ruleSections.map(
            (s) =>
              s.text && (
                <Fragment key={s.label}>
                  <section>
                    <h3 className="mb-2 border-l-4 border-amber-700/70 pl-3 text-lg font-semibold text-slate-100">
                      {s.label}
                    </h3>
                    <RuleText
                      text={s.text}
                      className="text-sm leading-relaxed text-slate-200"
                    />
                  </section>
                </Fragment>
              ),
          )}
        </div>
      )}

      <NemesisCardSections cards={nemesis.cards} />

      {!hideExpeditionRule && nemesis.rule && (
        <section>
          <h3 className="mb-2 border-l-4 border-amber-700/70 pl-3 text-lg font-semibold text-slate-100">
            探索行ルール
          </h3>
          <RuleText
            text={nemesis.rule}
            className="text-sm leading-relaxed text-slate-200"
          />
        </section>
      )}
    </div>
  );
}
