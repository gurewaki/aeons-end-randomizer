import { assetPath } from '../../lib/assetPath';

/**
 * テキスト中の「エーテル」を置換する用のインラインアイコン。
 * 行の高さに合わせて 1em のサイズで表示し、ベースラインに整列する。
 */
export function AetherIcon() {
  return (
    <img
      src={assetPath('/icons/Aether_Token.png')}
      alt="エーテル"
      className="inline-block h-[1em] w-auto align-middle"
    />
  );
}
