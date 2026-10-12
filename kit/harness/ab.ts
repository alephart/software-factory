/**
 * A/B de regresión con más corridas, para los ítems que el barrido marcó. Aplica la regla fijada
 * antes de correr (harness.config.json, "ab"): una métrica difiere si la diferencia de proporciones
 * es >= minDifference y el test exacto de Fisher (dos colas) da p < alpha. Ver README.md.
 *
 * Compara la última corrida `ab-baseline` con la última `ab-candidate` de cada agente y escribe un
 * resumen en Markdown sin el texto de las respuestas.
 *
 * Uso desde la app del agente:
 *   npx tsx scripts/regression/ab.ts --out ../../docs/tasks/<item>-results [--agent <alias>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseArgs } from 'util';
import { loadAgents, loadConfig } from './lib/config';
import { extractNumericClaims } from './lib/numeric-claims';
import { ItemRecord, RunFile } from './lib/types';

const { minDifference: MIN_DIFFERENCE, alpha: ALPHA } = loadConfig().ab;
const RUNS_DIR = join(__dirname, 'runs');

const logFactorial = (n: number) => { let sum = 0; for (let i = 2; i <= n; i++) sum += Math.log(i); return sum; };
const logChoose = (n: number, k: number) => logFactorial(n) - logFactorial(k) - logFactorial(n - k);

// Fisher exacto de dos colas para una tabla 2x2 [[a, b], [c, d]].
export function fisherExact(a: number, b: number, c: number, d: number): number {
  const row1 = a + b, row2 = c + d, col1 = a + c, total = row1 + row2;
  const probability = (x: number) => Math.exp(logChoose(row1, x) + logChoose(row2, col1 - x) - logChoose(total, col1));
  const observed = probability(a);
  let p = 0;
  for (let x = Math.max(0, col1 - row2); x <= Math.min(row1, col1); x++) {
    const px = probability(x);
    if (px <= observed * (1 + 1e-9)) p += px;
  }
  return Math.min(1, p);
}

interface Measure { name: string; kind: 'figure' | 'other'; base: number; candidate: number; baseN: number; candidateN: number }
interface MetricResult extends Measure { diff: number; p: number; status: 'FALLA' | 'PASA' | 'MEJORA' }

const relevant = (item: ItemRecord) => item.turns.flatMap((t) => t.ragCalls.flatMap((c) => c.chunks)).filter((c) => c.relevant);
const sourceOf = (c: { source: string | null; documentId: string | null }) => c.source ?? c.documentId ?? '(sin source)';
const gaveFigure = (item: ItemRecord, figure: number) => item.turns.some((t) => extractNumericClaims(t.reply).includes(figure));
const handedOff = (item: ItemRecord) => item.turns.some((t) => t.handoff?.mode === 'owner');

function measures(base: ItemRecord[], candidate: ItemRecord[]): Measure[] {
  const rate = (items: ItemRecord[], test: (i: ItemRecord) => boolean) => items.filter(test).length;
  const out: Measure[] = [];
  const sources = [...new Set([...base, ...candidate].flatMap((i) => relevant(i).map(sourceOf)))].sort();
  for (const source of sources) {
    out.push({ name: `recupera ${source}`, kind: 'other', base: rate(base, (i) => relevant(i).some((c) => sourceOf(c) === source)), candidate: rate(candidate, (i) => relevant(i).some((c) => sourceOf(c) === source)), baseN: base.length, candidateN: candidate.length });
  }
  for (const figure of base[0].expect?.figures ?? []) {
    out.push({ name: `da la cifra ${figure}`, kind: 'figure', base: rate(base, (i) => gaveFigure(i, figure)), candidate: rate(candidate, (i) => gaveFigure(i, figure)), baseN: base.length, candidateN: candidate.length });
  }
  out.push({ name: 'handoff', kind: 'other', base: rate(base, handedOff), candidate: rate(candidate, handedOff), baseN: base.length, candidateN: candidate.length });
  out.push({ name: 'recupera al menos un chunk relevante', kind: 'other', base: rate(base, (i) => relevant(i).length > 0), candidate: rate(candidate, (i) => relevant(i).length > 0), baseN: base.length, candidateN: candidate.length });
  return out;
}

function judge(m: Measure): MetricResult {
  const diff = m.candidate / m.candidateN - m.base / m.baseN;
  const p = fisherExact(m.candidate, m.candidateN - m.candidate, m.base, m.baseN - m.base);
  const differs = Math.abs(diff) >= MIN_DIFFERENCE && p < ALPHA;
  const status = !differs ? 'PASA' : m.kind === 'figure' && diff > 0 ? 'MEJORA' : 'FALLA';
  return { ...m, diff, p, status };
}

const latest = (alias: string, phase: string): RunFile | null => {
  const dir = join(RUNS_DIR, alias);
  if (!existsSync(dir)) return null;
  const file = readdirSync(dir).filter((f) => f.startsWith(`${phase}-`)).sort().pop();
  return file ? (JSON.parse(readFileSync(join(dir, file), 'utf8')) as RunFile) : null;
};

const { values } = parseArgs({ options: { out: { type: 'string' }, agent: { type: 'string' } } });
if (!values.out) throw new Error('Uso: ab.ts --out <carpeta> [--agent <alias>]');
const AGENT_ALIASES = values.agent ? [values.agent] : Object.keys(loadAgents());
mkdirSync(values.out, { recursive: true });

let failures = 0;
for (const alias of AGENT_ALIASES) {
  const base = latest(alias, 'ab-baseline');
  const candidate = latest(alias, 'ab-candidate');
  if (!base || !candidate) { console.log(`${alias}: sin corridas ab-baseline / ab-candidate`); continue; }

  const byId = (run: RunFile) => run.items.reduce<Map<string, ItemRecord[]>>((acc, i) => acc.set(i.id, [...(acc.get(i.id) ?? []), i]), new Map());
  const baseItems = byId(base), candidateItems = byId(candidate);
  const lines: string[] = [];
  const procedence: string[] = [];
  const same = (label: string, a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) procedence.push(`- **FALLA** ${label} distinto entre brazos`); };
  same('hash de la config del agente', base.provenance.agent.configHash, candidate.provenance.agent.configHash);
  same('defaults de plataforma', base.provenance.defaultsHash, candidate.provenance.defaultsHash);
  same('diales', base.provenance.dials, candidate.provenance.dials);
  same('chunks por fuente', base.provenance.chunksBySource, candidate.provenance.chunksBySource);
  same('suite', base.provenance.suite.sha256, candidate.provenance.suite.sha256);
  same('reranker', base.provenance.reranker, candidate.provenance.reranker);
  if (!base.provenance.invariantVsBase) procedence.push('- **FALLA** el brazo base no corrió sobre el commit base');
  failures += procedence.length;

  const verdicts: string[] = [];
  const blocks: string[] = [];
  for (const [id, baseRuns] of baseItems) {
    const candidateRuns = candidateItems.get(id);
    if (!candidateRuns) continue;
    const results = measures(baseRuns, candidateRuns).map(judge);
    const itemFailed = results.some((r) => r.status === 'FALLA');
    failures += itemFailed ? 1 : 0;
    verdicts.push(`| ${id} | ${baseRuns.length} / ${candidateRuns.length} | ${itemFailed ? 'FALLA' : 'RUIDO (PASA)'} |`);
    blocks.push(
      `### ${id}`,
      '',
      '| métrica | base | candidato | diferencia | p (Fisher) | estado |',
      '|---|---|---|---|---|---|',
      ...results.map((r) => `| ${r.name} | ${r.base}/${r.baseN} | ${r.candidate}/${r.candidateN} | ${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(2)} | ${r.p.toFixed(3)} | ${r.status} |`),
      '',
    );
  }
  lines.push(
    `# A/B ${base.provenance.agent.name} — base ${base.provenance.gitSha} vs candidato ${candidate.provenance.gitSha}`,
    '',
    `Regla fijada antes de correr: diferencia ≥ ${MIN_DIFFERENCE} y Fisher p < ${ALPHA}. ${base.provenance.runsPerItem} corridas por ítem y brazo.`,
    '',
    '## Procedencia',
    '',
    ...(procedence.length ? procedence : ['- Sin diferencias: misma config, defaults, diales, conocimiento, suite y reranker.']),
    '',
    '## Veredicto por ítem',
    '',
    '| ítem | corridas base / candidato | veredicto |',
    '|---|---|---|',
    ...verdicts,
    '',
    '## Detalle',
    '',
    ...blocks,
  );
  writeFileSync(join(values.out, `ab-${alias}.md`), lines.join('\n'));
  console.log(`${alias}: ${verdicts.map((v) => v.split('|').filter(Boolean).map((c) => c.trim()).join(' ')).join(' · ')}`);
}
process.exit(failures ? 1 : 0);
