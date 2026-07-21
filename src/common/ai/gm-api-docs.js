import chromeMv3Corpus from './generated/gm-api-docs.chrome-mv3.json';
import firefoxMv2Corpus from './generated/gm-api-docs.firefox-mv2.json';

const corpus = __.MV3 ? chromeMv3Corpus : firefoxMv2Corpus;
const knownNames = new Set(corpus.map(({ name }) => name));
for (const { documentation } of corpus) {
  for (const match of documentation.matchAll(/\bGM\.[A-Za-z]\w*/g)) {
    knownNames.add(match[0]);
  }
}
const MAX_RESULTS = 8;
const MAX_DOCUMENTATION_LENGTH = 1800;

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreEntry(entry, normalizedQuery, terms) {
  const name = normalize(entry.name);
  const documentation = normalize(entry.documentation);
  let score = 0;
  if (name === normalizedQuery) score += 1000;
  else if (name.startsWith(normalizedQuery)) score += 500;
  else if (name.includes(normalizedQuery)) score += 250;
  for (const term of terms) {
    if (name.split(' ').includes(term)) score += 80;
    else if (name.includes(term)) score += 40;
    if (documentation.includes(term)) score += 5;
  }
  return score;
}

function excerptDocumentation(documentation, terms) {
  if (documentation.length <= MAX_DOCUMENTATION_LENGTH) return documentation;
  const lines = documentation.split('\n');
  const selected = [lines[0]];
  for (let index = 1; index < lines.length; index += 1) {
    const normalizedLine = normalize(lines[index]);
    if (terms.some(term => normalizedLine.includes(term))) {
      selected.push(lines[index]);
      if (lines[index + 1]) selected.push(lines[index + 1]);
    }
  }
  const excerpt = [...new Set(selected)].join('\n');
  const source = excerpt.length > lines[0].length ? excerpt : documentation;
  return source.length > MAX_DOCUMENTATION_LENGTH
    ? `${source.slice(0, MAX_DOCUMENTATION_LENGTH - 1).trimEnd()}…`
    : source;
}

/**
 * Searches the build-target corpus embedded by webpack. Results are structured-
 * clone-safe and deliberately bounded before they are exposed to the model.
 *
 * @param {string} query API name or documentation terms.
 * @param {number} [limit=4] Maximum result count, capped at eight.
 * @returns {{name: string, documentation: string}[]}
 */
export function searchGmApiDocs(query, limit = 4) {
  const normalizedQuery = normalize(String(query || ''));
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(' ').filter(term => term !== 'gm' && term !== 'api');
  const boundedLimit = Math.min(MAX_RESULTS, Math.max(1, Math.trunc(limit) || 4));
  return corpus
    .map(entry => ({ entry, score: scoreEntry(entry, normalizedQuery, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, boundedLimit)
    .map(({ entry }) => ({
      name: entry.name,
      documentation: excerptDocumentation(entry.documentation, terms),
    }));
}

/** @param {string} name @returns {boolean} */
export function isKnownGmApi(name) {
  return knownNames.has(name);
}
