import { describe, it, expect } from 'vitest';
import { readingTime } from './reading-time';

describe('readingTime', () => {
  it('texto corto redondea a minimo 1 minuto', () => {
    expect(readingTime('Un texto muy corto de pocas palabras.')).toBe(1);
  });

  it('texto de ~440 palabras da 2 minutos', () => {
    const text = Array(440).fill('palabra').join(' ');
    expect(readingTime(text)).toBe(2);
  });
});
