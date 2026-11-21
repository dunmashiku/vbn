import type { ReactNode } from "react";

/**
 * Tiny, safe Markdown renderer for assistant replies: paragraphs, bullet and
 * numbered lists, **bold**, [links](https://...) and bare URLs. Builds React
 * elements directly (no innerHTML), and only allows http(s) links.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)<]+[^\s)<.,;:!?])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${k++}`;
    if (m[1]) out.push(<strong key={key}>{m[1]}</strong>);
    else if (m[2] && m[3]) out.push(<a key={key} className="link" href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}<span className="sr-only"> (opens in a new tab)</span></a>);
    else if (m[4]) out.push(<a key={key} className="link break-all" href={m[4]} target="_blank" rel="noopener noreferrer">{m[4]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const re = ordered ? numbered : bullet;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i]!)) items.push(lines[i++]!.replace(re, ""));
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={b++} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {items.map((it, j) => <li key={j}>{inline(it, `${b}-${j}`)}</li>)}
        </Tag>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !bullet.test(lines[i]!) && !numbered.test(lines[i]!)) {
      para.push(lines[i++]!.replace(/^#+\s*/, ""));
    }
    blocks.push(<p key={b++}>{inline(para.join(" "), `p${b}`)}</p>);
  }
  return <div className="space-y-3">{blocks}</div>;
}
