/**
 * basePath を考慮した public 配下のアセットの URL を返す。
 * 例: assetPath('/icons/Aether_Token.png')
 *   開発時 → '/icons/Aether_Token.png'
 *   本番   → '/aeons-end-randomizer/icons/Aether_Token.png'
 *
 * NOTE: BASE_PATH は next.config.ts と同期させること。
 */
const isProd = process.env.NODE_ENV === 'production';
const BASE_PATH = isProd ? '/aeons-end-randomizer' : '';

export function assetPath(p: string): string {
  const normalized = p.startsWith('/') ? p : `/${p}`;
  return `${BASE_PATH}${normalized}`;
}
