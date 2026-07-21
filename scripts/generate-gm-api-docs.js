const fs = require('fs/promises');
const path = require('path');

const DOCS_URL = 'https://violentmonkey.github.io/api/gm/';
const OUTPUT_DIR = path.resolve(__dirname, '../src/common/ai/generated');
const TARGETS = ['firefox-mv2', 'chrome-mv3'];
const VERSION_HISTORY = /@since|\bsince\s+VM|\bbefore\s+v?\d|\badded\s+in\s+VM|\bas\s+of\s+VM|\bVM\d+\./i;

/**
 * This generator deliberately ingests one authoritative page and checks in the
 * compact result. Normal builds must never fetch documentation: they import the
 * generated modules, so webpack watch remains fast and offline/reproducible.
 *
 * The page currently has no API-level browser/manifest support metadata. We
 * therefore keep only APIs presented without an API-level platform restriction
 * (the provable Firefox/Chrome intersection) and strip opposite-platform
 * parameter notes per target. Do not infer support from an API's name or from
 * extension implementation details. If upstream adds structured support data,
 * teach `isEntrySupported` to consume that markup before widening the corpus.
 */

function decodeHtml(text) {
  const entities = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const radix = entity[1].toLowerCase() === 'x' ? 16 : 10;
      const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
      return String.fromCodePoint(parseInt(digits, radix));
    }
    return entities[entity] || match;
  });
}

function htmlToLines(html) {
  return decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|pre|figure|ol|ul|table|tr)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ''))
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isTargetSpecificLine(line, target) {
  if (target === 'chrome-mv3') {
    return /Firefox[- ]only|only (?:present|available|works?) in Firefox/i.test(line);
  }
  return /Chrom(?:e|ium)(?:-based)?[- ]only|Only for Chromium|only (?:present|available|works?) in Chrom(?:e|ium)/i.test(line);
}

function removeTargetSpecificListItems(html, target) {
  const stack = [];
  const ranges = [];
  const tags = html.matchAll(/<\/?li\b[^>]*>/gi);
  for (const tag of tags) {
    if (tag[0][1] !== '/') {
      stack.push(tag.index);
    } else {
      const start = stack.pop();
      if (start == null) continue;
      const end = tag.index + tag[0].length;
      const label = htmlToLines(html.slice(start, end)).slice(0, 3).join(' ');
      if (isTargetSpecificLine(label, target)) ranges.push([start, end]);
    }
  }
  const outerRanges = ranges
    .sort((a, b) => a[0] - b[0] || b[1] - a[1])
    .filter((range, index, all) => !all.slice(0, index).some(
      outer => outer[0] <= range[0] && outer[1] >= range[1],
    ));
  return outerRanges
    .sort((a, b) => b[0] - a[0])
    .reduce((result, [start, end]) => result.slice(0, start) + result.slice(end), html);
}

function stripVersionHistory(line) {
  const cleaned = line
    .replace(/\s*-\s*since VM\d+(?:\.\d+)*(?:,\s*)?/gi, ' - ')
    .trim();
  return VERSION_HISTORY.test(cleaned) ? '' : cleaned;
}

function sanitizeDocumentation(html, target) {
  return htmlToLines(removeTargetSpecificListItems(html, target))
    .map(stripVersionHistory)
    .filter(line => line && !isTargetSpecificLine(line, target))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function isEntrySupported(html, target) {
  const leading = htmlToLines(html).slice(0, 3).join(' ');
  return !isTargetSpecificLine(leading, target);
}

function parseCorpus(html, target) {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (!article) throw new Error('The GM documentation article was not found');
  const headings = [...article.matchAll(/<h([23])\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const entries = [];
  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index];
    const level = Number(match[1]);
    const name = htmlToLines(match[3]).join(' ');
    if ((level === 2 && name !== 'unsafeWindow' && name !== 'GM.*') || name === 'GM_*') continue;
    const start = match.index + match[0].length;
    const end = headings[index + 1]?.index ?? article.length;
    const section = article.slice(start, end);
    if (!isEntrySupported(section, target)) continue;
    const documentation = sanitizeDocumentation(section, target);
    if (documentation) entries.push({ name, documentation });
  }
  if (entries.length < 20) throw new Error(`Only ${entries.length} GM API entries were parsed`);
  return entries;
}

function serializeCorpus(entries) {
  return `${JSON.stringify(entries)}\n`;
}

async function generate() {
  const response = await fetch(DOCS_URL, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`Failed to fetch ${DOCS_URL}: ${response.status}`);
  const html = await response.text();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  for (const target of TARGETS) {
    const entries = parseCorpus(html, target);
    const output = path.join(OUTPUT_DIR, `gm-api-docs.${target}.json`);
    await fs.writeFile(output, serializeCorpus(entries));
    console.log(`${target}: ${entries.length} entries -> ${path.relative(process.cwd(), output)}`);
  }
}

module.exports = { DOCS_URL, parseCorpus, sanitizeDocumentation };

if (require.main === module) {
  generate().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
