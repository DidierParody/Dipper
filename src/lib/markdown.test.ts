import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { remarkPlugins, rehypePlugins } from './markdown';

function render(md: string): string {
  return renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins, rehypePlugins }, md));
}

describe('markdown math', () => {
  it('renderiza un bloque $$ con array, saltos de línea y hline (caso real del post MER)', () => {
    const md = [
      '$$',
      '\\begin{array}{rl}\\text{flecha de entrada} & = N \\\\+\\;\\text{flecha de salida} & = 1 \\\\\\hline\\text{cardinalidad} & = N\\end{array}',
      '$$',
    ].join('\n');
    const html = render(md);
    expect(html).toContain('katex-display');
    expect(html).toContain('flecha de salida');
    expect(html).not.toContain('\\+;');
    expect(html).not.toContain('$$');
  });

  it('renderiza matemáticas en línea con $...$', () => {
    const html = render('La relación es $1:N$ entre series y posts.');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('$1:N$');
  });

  it('no rompe el resaltado de código ni las tablas', () => {
    const html = render('| a | b |\n| --- | --- |\n| 1 | 2 |\n\n```ts\nconst x = 1;\n```');
    expect(html).toContain('<table>');
    expect(html).toContain('hljs');
  });

  it('un error de LaTeX se muestra en el post sin romper el render', () => {
    const html = render('$$\n\\frac{1}{\n$$\n\nTexto después.');
    expect(html).toContain('Texto después.');
  });
});
