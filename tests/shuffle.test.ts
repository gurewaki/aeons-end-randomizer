import { describe, it, expect, vi, afterEach } from 'vitest';
import { shuffle } from '../lib/randomizer/shuffle';

describe('shuffle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('入力配列を変更しない', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('要素集合と長さを保持する', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('Math.random を固定すると決定的になる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const a = shuffle([10, 20, 30, 40]);
    const b = shuffle([10, 20, 30, 40]);
    expect(a).toEqual(b);
  });

  it('空配列を扱える', () => {
    expect(shuffle([])).toEqual([]);
  });
});
