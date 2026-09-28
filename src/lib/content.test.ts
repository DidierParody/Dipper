import { describe, it, expect } from 'vitest';
import { contentBaseUrl, resolveAssetUrl, stripFrontmatter } from './content';

describe('contentBaseUrl', () => {
  it('arma la URL de jsDelivr con repo, sha y path', () => {
    expect(
      contentBaseUrl({ repo: 'DidierParody/Dipper', path: 'content/posts/x', commit_sha: 'abc123' })
    ).toBe('https://cdn.jsdelivr.net/gh/DidierParody/Dipper@abc123/content/posts/x');
  });
});

describe('resolveAssetUrl', () => {
  const base = 'https://cdn.jsdelivr.net/gh/DidierParody/Dipper@abc123/content/posts/x';

  it('resuelve ./images/a.png relativo al base', () => {
    expect(resolveAssetUrl(base, './images/a.png')).toBe(
      'https://cdn.jsdelivr.net/gh/DidierParody/Dipper@abc123/content/posts/x/images/a.png'
    );
  });

  it('resuelve images/a.png (sin ./) relativo al base', () => {
    expect(resolveAssetUrl(base, 'images/a.png')).toBe(
      'https://cdn.jsdelivr.net/gh/DidierParody/Dipper@abc123/content/posts/x/images/a.png'
    );
  });

  it('resuelve ../x.png subiendo un nivel', () => {
    expect(resolveAssetUrl(base, '../x.png')).toBe(
      'https://cdn.jsdelivr.net/gh/DidierParody/Dipper@abc123/content/posts/x.png'
    );
  });

  it('deja intacta una ruta absoluta /abs', () => {
    expect(resolveAssetUrl(base, '/abs')).toBe('/abs');
  });

  it('deja intacta una URL https://', () => {
    expect(resolveAssetUrl(base, 'https://example.com/img.png')).toBe('https://example.com/img.png');
  });

  it('deja intacta una URL protocol-relative //cdn', () => {
    expect(resolveAssetUrl(base, '//cdn.example.com/img.png')).toBe('//cdn.example.com/img.png');
  });

  it('deja intacto un anchor #anchor', () => {
    expect(resolveAssetUrl(base, '#anchor')).toBe('#anchor');
  });

  it('deja intacta una data: URL', () => {
    const dataUrl = 'data:image/png;base64,AAAA';
    expect(resolveAssetUrl(base, dataUrl)).toBe(dataUrl);
  });

  it('deja intacto un mailto:', () => {
    expect(resolveAssetUrl(base, 'mailto:foo@example.com')).toBe('mailto:foo@example.com');
  });

  it('devuelve el string vacio tal cual', () => {
    expect(resolveAssetUrl(base, '')).toBe('');
  });
});

describe('stripFrontmatter', () => {
  it('quita el frontmatter YAML estandar', () => {
    const md = '---\ntitle: Hola\nsummary: Mundo\n---\n\nCuerpo del post.';
    expect(stripFrontmatter(md)).toBe('Cuerpo del post.');
  });

  it('tolera CRLF en el frontmatter y en el cuerpo', () => {
    const md = '---\r\ntitle: Hola\r\n---\r\n\r\nCuerpo con CRLF.';
    expect(stripFrontmatter(md)).toBe('Cuerpo con CRLF.');
  });

  it('devuelve el markdown sin cambios si no hay frontmatter', () => {
    const md = 'Solo texto plano, sin metadata.';
    expect(stripFrontmatter(md)).toBe(md);
  });

  it('no confunde un --- dentro del cuerpo con frontmatter', () => {
    const md = 'Un parrafo normal.\n\n---\n\nOtro parrafo despues de un separador.';
    expect(stripFrontmatter(md)).toBe(md);
  });

  it('no confunde un --- inicial sin cierre con frontmatter', () => {
    const md = '---\n\nEsto es un hr al inicio, no hay segundo --- que cierre.';
    expect(stripFrontmatter(md)).toBe(md);
  });
});
