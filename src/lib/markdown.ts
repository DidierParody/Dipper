import type { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';

// Plugins del render de posts. remark-math reconoce $...$ y $$...$$ antes de que
// markdown procese los escapes (\\ se comería las barras del LaTeX).
export const remarkPlugins: NonNullable<Options['remarkPlugins']> =[remarkGfm, remarkMath];

// throwOnError: false → una fórmula inválida se muestra en rojo en vez de romper el post.
export const rehypePlugins: NonNullable<Options['rehypePlugins']> =[rehypeHighlight, [rehypeKatex, { throwOnError: false }]];
