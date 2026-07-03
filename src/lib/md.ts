export function parseNotionMd(md: string): { title: string; body: string } {
  const lines = md.split('\n');
  const h1Index = lines.findIndex((l) => /^# (?!#)/.test(l));
  if (h1Index === -1) return { title: '', body: md.trim() };
  const title = lines[h1Index].replace(/^# /, '').trim();
  const body = [...lines.slice(0, h1Index), ...lines.slice(h1Index + 1)]
    .join('\n')
    .trim();
  return { title, body };
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}
