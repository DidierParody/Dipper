import { describe, it, expect } from 'vitest';
import { parseNotionMd, slugify } from './md';

describe('parseNotionMd', () => {
  it('extrae el primer H1 como titulo y lo quita del cuerpo', () => {
    const { title, body } = parseNotionMd('# Mi titulo\n\nParrafo uno.');
    expect(title).toBe('Mi titulo');
    expect(body).toBe('Parrafo uno.');
    expect(body).not.toContain('# Mi titulo');
  });

  it('sin H1 devuelve titulo vacio y cuerpo intacto', () => {
    const { title, body } = parseNotionMd('Solo texto plano.');
    expect(title).toBe('');
    expect(body).toBe('Solo texto plano.');
  });

  it('no confunde H2 con el titulo', () => {
    const { title } = parseNotionMd('## Seccion\n\ntexto');
    expect(title).toBe('');
  });
});

describe('slugify', () => {
  it('convierte a kebab-case sin acentos', () => {
    expect(slugify('Particionar tablas en Postgres ¡sin dolor!')).toBe(
      'particionar-tablas-en-postgres-sin-dolor'
    );
  });
  it('colapsa espacios y guiones repetidos', () => {
    expect(slugify('a  b --- c')).toBe('a-b-c');
  });
});
