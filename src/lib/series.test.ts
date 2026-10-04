import { describe, it, expect } from 'vitest';
import { groupSeries } from './supabase';

const serie = (slug: string) => ({ slug, title: slug.toUpperCase(), description: null });

describe('groupSeries', () => {
  it('agrupa por serie, ordena las partes y suma minutos', () => {
    const out = groupSeries([
      { slug: 'mer', title: 'MER', series_order: 2, reading_minutes: 10, published_at: '2026-09-29T14:43:46Z', series: serie('modelado') },
      { slug: 'intro', title: 'Intro', series_order: 1, reading_minutes: 2, published_at: '2026-09-29T14:43:48Z', series: [serie('modelado')] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].posts.map((p) => p.slug)).toEqual(['intro', 'mer']);
    expect(out[0].total_minutes).toBe(12);
    expect(out[0].last_published_at).toBe('2026-09-29T14:43:48Z');
  });

  it('pone primero la serie con el post más reciente e ignora filas sin serie', () => {
    const out = groupSeries([
      { slug: 'a', title: 'A', series_order: 1, reading_minutes: 3, published_at: '2026-07-01T00:00:00Z', series: serie('vieja') },
      { slug: 'b', title: 'B', series_order: 1, reading_minutes: 3, published_at: '2026-10-01T00:00:00Z', series: serie('nueva') },
      { slug: 'c', title: 'C', series_order: null, reading_minutes: 3, published_at: '2026-10-02T00:00:00Z', series: null },
    ]);
    expect(out.map((s) => s.slug)).toEqual(['nueva', 'vieja']);
  });
});
