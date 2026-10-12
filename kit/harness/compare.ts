/**
 * Compara una corrida candidata contra la línea base del mismo agente y
 * escribe un resumen en Markdown SIN el texto de las respuestas: ids, categorías,
 * estado y motivo. Ese resumen se versiona; los JSON crudos de runs/ no.
 *
 * Uso desde la app del agente:
 *   npx tsx scripts/regression/compare.ts --base runs/<alias>/baseline-….json \
 *     --candidate runs/<alias>/candidate-….json --out ../../docs/tasks/<item>-results/<alias>.md
 * Sale con código 1 si hay algún FALLA.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { parseArgs } from 'util';
import { compareItem, compareProvenance, ItemResult, worst } from './lib/criteria';
import { ItemRecord, RunFile } from './lib/types';

const { values } = parseArgs({ options: { base: { type: 'string' }, candidate: { type: 'string' }, out: { type: 'string' } } });
if (!values.base || !values.candidate || !values.out) throw new Error('Uso: compare.ts --base <json> --candidate <json> --out <md>');

const base = JSON.parse(readFileSync(values.base, 'utf8')) as RunFile;
const candidate = JSON.parse(readFileSync(values.candidate, 'utf8')) as RunFile;

const byId = (items: ItemRecord[]) =>
  items.reduce<Map<string, ItemRecord[]>>((acc, item) => acc.set(item.id, [...(acc.get(item.id) ?? []), item]), new Map());
const baseItems = byId(base.items);
const candidateItems = byId(candidate.items);

const provenanceFindings = compareProvenance(base.provenance, candidate.provenance);
const results: ItemResult[] = [...candidateItems].map(([id, candidates]) => {
  const baseRuns = baseItems.get(id);
  if (!baseRuns) return { id, category: candidates[0].category, status: 'FALLA', findings: [{ status: 'FALLA', criterion: 'suite', detail: 'no existe en la línea base' }] };
  return compareItem(baseRuns, candidates, candidate.provenance.promptFigures);
});
const missing = [...baseItems.keys()].filter((id) => !candidateItems.has(id));
const verdict = worst([...provenanceFindings.map((f) => f.status), ...results.map((r) => r.status), ...(missing.length ? ['FALLA' as const] : [])]);

const p = (label: string, run: RunFile['provenance']) =>
  `| ${label} | ${run.gitSha} (${run.gitBranch}) | ${run.startedAt} | ${run.agent.configHash} | ${run.agent.toolsEnabled.length} tools | ${run.runsPerItem} |`;
const lines = [
  `# Regresión ${candidate.provenance.agent.name} — ${base.provenance.phase} vs ${candidate.provenance.phase}`,
  '',
  `**Veredicto: ${verdict}** · suite v${candidate.provenance.suite.version} (${candidate.provenance.suite.author}) · modelo ${candidate.provenance.agent.model}`,
  '',
  '| corrida | commit | inicio | hash config | tools | corridas por ítem |',
  '|---|---|---|---|---|---|',
  p(base.provenance.phase, base.provenance),
  p(candidate.provenance.phase, candidate.provenance),
  '',
  '## Procedencia',
  '',
  ...(provenanceFindings.length ? provenanceFindings.map((f) => `- **${f.status}** ${f.detail}`) : ['- Sin diferencias: misma config, defaults, diales, conocimiento, suite y reranker.']),
  ...(missing.length ? [`- **FALLA** ítems de la base que el candidato no corrió: ${missing.join(', ')}`] : []),
  '',
  '## Ítems',
  '',
  '| ítem | categoría | estado | motivos |',
  '|---|---|---|---|',
  ...results.map((r) => `| ${r.id} | ${r.category} | ${r.status} | ${r.findings.map((f) => `${f.status} ${f.criterion}: ${f.detail}`).join('<br>') || '—'} |`),
  '',
  'Cada REVISAR necesita una decisión humana registrada en el ítem antes de promover el cambio.',
  '',
];

mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(values.out, lines.join('\n'));
console.log(`Veredicto ${verdict}: ${results.filter((r) => r.status === 'FALLA').length} FALLA, ${results.filter((r) => r.status === 'REVISAR').length} REVISAR, ${results.filter((r) => r.status === 'PASA').length} PASA → ${values.out}`);
process.exit(verdict === 'FALLA' ? 1 : 0);
