import { describe, it, expect } from 'vitest';
import { parseContentLink, slugify } from './content-link.ts';

const REPO = 'DidierParody/Dipper';

describe('parseContentLink', () => {
  it('acepta la forma blob', () => {
    const r = parseContentLink(
      'https://github.com/DidierParody/Dipper/blob/main/content/posts/spark-desde-cero/index.md',
      REPO
    );
    expect(r).toEqual({
      repo: REPO,
      ref: 'main',
      dir: 'content/posts/spark-desde-cero',
      slug: 'spark-desde-cero',
    });
  });

  it('acepta la forma tree', () => {
    const r = parseContentLink(
      'https://github.com/DidierParody/Dipper/tree/main/content/posts/spark-desde-cero',
      REPO
    );
    expect(r).toEqual({
      repo: REPO,
      ref: 'main',
      dir: 'content/posts/spark-desde-cero',
      slug: 'spark-desde-cero',
    });
  });

  it('acepta la forma raw', () => {
    const r = parseContentLink(
      'https://raw.githubusercontent.com/DidierParody/Dipper/main/content/posts/spark-desde-cero/index.md',
      REPO
    );
    expect(r).toEqual({
      repo: REPO,
      ref: 'main',
      dir: 'content/posts/spark-desde-cero',
      slug: 'spark-desde-cero',
    });
  });

  it('acepta la forma ruta (carpeta)', () => {
    const r = parseContentLink('content/posts/spark-desde-cero', REPO);
    expect(r).toEqual({
      repo: REPO,
      ref: 'main',
      dir: 'content/posts/spark-desde-cero',
      slug: 'spark-desde-cero',
    });
  });

  it('acepta la forma ruta con index.md', () => {
    const r = parseContentLink('content/posts/spark-desde-cero/index.md', REPO);
    expect(r).toEqual({
      repo: REPO,
      ref: 'main',
      dir: 'content/posts/spark-desde-cero',
      slug: 'spark-desde-cero',
    });
  });

  it('soporta trailing slash en la forma tree', () => {
    const r = parseContentLink(
      'https://github.com/DidierParody/Dipper/tree/main/content/posts/spark-desde-cero/',
      REPO
    );
    expect(r.slug).toBe('spark-desde-cero');
  });

  it('soporta trailing slash en la forma ruta', () => {
    const r = parseContentLink('content/posts/spark-desde-cero/', REPO);
    expect(r.slug).toBe('spark-desde-cero');
  });

  it('rechaza un repo equivocado', () => {
    expect(() =>
      parseContentLink(
        'https://github.com/otro-usuario/otro-repo/blob/main/content/posts/x/index.md',
        REPO
      )
    ).toThrow(/repo/i);
  });

  it('rechaza un ref con "/"', () => {
    expect(() =>
      parseContentLink(
        'https://github.com/DidierParody/Dipper/blob/feature/branch/content/posts/x/index.md',
        REPO
      )
    ).toThrow();
  });

  it('rechaza un slug inválido', () => {
    expect(() => parseContentLink('content/posts/Slug_Invalido', REPO)).toThrow(/slug/i);
  });

  it('rechaza rutas que no son content/posts/<slug>', () => {
    expect(() => parseContentLink('content/series/spark-desde-cero.md', REPO)).toThrow();
  });

  it('rechaza un link vacío', () => {
    expect(() => parseContentLink('', REPO)).toThrow();
  });

  it('rechaza un host no soportado', () => {
    expect(() =>
      parseContentLink('https://gitlab.com/DidierParody/Dipper/blob/main/content/posts/x', REPO)
    ).toThrow(/host/i);
  });
});

describe('slugify', () => {
  it('normaliza acentos y espacios', () => {
    expect(slugify('Spark Desde Cero: Particiones y Shuffles')).toBe(
      'spark-desde-cero-particiones-y-shuffles'
    );
  });

  it('maneja eñes y tildes', () => {
    expect(slugify('Diseño de Señales')).toBe('diseno-de-senales');
  });
});
