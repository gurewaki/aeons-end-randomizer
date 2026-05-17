'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface Ctx {
  /** ターン順カードシャッフラで「公開を開始した」状態か */
  inProgress: boolean;
  setInProgress: (v: boolean) => void;
}

const TurnOrderProgressContext = createContext<Ctx>({
  inProgress: false,
  setInProgress: () => {},
});

export function TurnOrderProgressProvider({ children }: { children: ReactNode }) {
  const [inProgress, setInProgress] = useState(false);

  // 進行中はブラウザの閉じる/更新にも確認ダイアログを出す
  useEffect(() => {
    if (!inProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 旧仕様互換 (Chrome 等)
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [inProgress]);

  return (
    <TurnOrderProgressContext.Provider value={{ inProgress, setInProgress }}>
      {children}
    </TurnOrderProgressContext.Provider>
  );
}

export function useTurnOrderProgress() {
  return useContext(TurnOrderProgressContext);
}
