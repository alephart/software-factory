import { escapeRegExp, loadConfig } from './config';
import { extractNumericClaims } from './numeric-claims';
import { ItemRecord, RunFile, TurnRecord } from './types';

// Criterios de regresión: el LLM no es determinista, así que no se compara texto exacto.
// Cada criterio da PASA, REVISAR (decisión humana registrada) o FALLA (regresión).
export type Status = 'PASA' | 'REVISAR' | 'FALLA';
export interface Finding { status: Status; criterion: string; detail: string }

const SEVERITY: Record<Status, number> = { PASA: 0, REVISAR: 1, FALLA: 2 };
export const worst = (statuses: Status[]): Status =>
  statuses.reduce<Status>((acc, s) => (SEVERITY[s] > SEVERITY[acc] ? s : acc), 'PASA');

const GUARDED_TOOLS = loadConfig().guardedTools;
const TOOL_NAMES = GUARDED_TOOLS.length ? new RegExp(GUARDED_TOOLS.map(escapeRegExp).join('|'), 'i') : null;
const MONEY_WORDS = /\$|\bpesos\b|\bmill[oó]n(es)?\b|\bcop\b/i;
const PERCENT = /\d+(?:[.,]\d+)?\s?%/g;
const LENGTH_RATIO_LIMIT = 2;

const relevantChunks = (turns: TurnRecord[]) => turns.flatMap((t) => t.ragCalls.flatMap((c) => c.chunks)).filter((c) => c.relevant);
const sourceOf = (chunk: { source: string | null; documentId: string | null }) => chunk.source ?? chunk.documentId ?? '(sin source)';
const sourcesOf = (item: ItemRecord) => new Set(relevantChunks(item.turns).map(sourceOf));
const chunkKeysOf = (item: ItemRecord) => new Set(relevantChunks(item.turns).map((c) => `${sourceOf(c)}#${c.chunkIndex}`));
const handedOff = (item: ItemRecord) => item.turns.some((t) => t.handoff?.mode === 'owner');
const triggerOf = (item: ItemRecord) => item.turns.find((t) => t.handoff?.mode === 'owner')?.handoff?.triggeredBy ?? null;
const majority = <T>(values: T[]): T => {
  const counts = new Map<string, { value: T; n: number }>();
  for (const value of values) {
    const key = JSON.stringify(value);
    counts.set(key, { value, n: (counts.get(key)?.n ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n)[0].value;
};
const median = (numbers: number[]) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// 1. Misma fuente de conocimiento recuperada (solo lo que pasó el umbral del reranker).
function checkSources(base: ItemRecord[], candidate: ItemRecord): Finding {
  const baseSets = base.map(sourcesOf);
  const union = new Set(baseSets.flatMap((s) => [...s]));
  const intersection = [...union].filter((source) => baseSets.every((s) => s.has(source)));
  const sources = sourcesOf(candidate);
  const added = [...sources].filter((s) => !union.has(s));
  const lost = intersection.filter((s) => !sources.has(s));
  if (added.length || lost.length) {
    return { status: 'FALLA', criterion: 'fuente', detail: `nuevas: ${added.join(', ') || '—'}; perdidas: ${lost.join(', ') || '—'}` };
  }
  const baseKeys = new Set(base.flatMap((item) => [...chunkKeysOf(item)]));
  const newKeys = [...chunkKeysOf(candidate)].filter((k) => !baseKeys.has(k));
  return newKeys.length
    ? { status: 'REVISAR', criterion: 'fuente', detail: `mismas fuentes, otros chunks: ${newKeys.join(', ')}` }
    : { status: 'PASA', criterion: 'fuente', detail: '' };
}

// 2. Ningún precio inventado: cada cifra de la respuesta tiene que estar en lo que el agente
// vio (chunks relevantes, prompts, mensajes del contacto o sus propias respuestas anteriores).
// Cifras del contacto que la respuesta repite. Repetirla no siempre es confirmarla ("no puedo
// confirmar el precio de $1.200.000" es el comportamiento esperado), así que
// solo es REVISAR cuando la mayoría de la base no la repetía.
const echoedFigures = (item: ItemRecord): number[] => {
  const userFigures = new Set(item.turns.flatMap((t) => extractNumericClaims(t.user)));
  const knowledge = new Set(relevantChunks(item.turns).flatMap((c) => c.figures));
  return item.turns.flatMap((t) => extractNumericClaims(t.reply)).filter((n) => userFigures.has(n) && !knowledge.has(n));
};
const baseMajorityEchoes = (base: ItemRecord[], n: number) => base.filter((b) => echoedFigures(b).includes(n)).length > base.length / 2;

function checkFigures(candidate: ItemRecord, promptFigures: number[], base: ItemRecord[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<number>(promptFigures);
  const userFigures = new Set<number>();
  const knowledgeFigures = new Set<number>(promptFigures);
  for (const turn of candidate.turns) {
    extractNumericClaims(turn.user).forEach((n) => { seen.add(n); userFigures.add(n); });
    relevantChunks([turn]).forEach((c) => c.figures.forEach((n) => { seen.add(n); knowledgeFigures.add(n); }));
    const figures = extractNumericClaims(turn.reply);
    const invented = figures.filter((n) => !seen.has(n));
    if (invented.length) findings.push({ status: 'FALLA', criterion: 'cifras', detail: `cifras sin fuente: ${invented.join(', ')}` });
    const echoed = figures.filter((n) => userFigures.has(n) && !knowledgeFigures.has(n) && !baseMajorityEchoes(base, n));
    if (echoed.length) findings.push({ status: 'REVISAR', criterion: 'cifras', detail: `repite una cifra del contacto que no está en el conocimiento (la base no lo hacía): ${echoed.join(', ')}` });
    if (!figures.length && MONEY_WORDS.test(turn.reply)) findings.push({ status: 'REVISAR', criterion: 'cifras', detail: 'habla de dinero sin una cifra reconocible' });
    const percents = turn.reply.match(PERCENT) ?? [];
    if (percents.length) findings.push({ status: 'REVISAR', criterion: 'cifras', detail: `porcentajes a verificar a mano: ${percents.join(', ')}` });
    figures.forEach((n) => seen.add(n));
  }
  if (candidate.category === 'figure_in_knowledge') {
    const expected = candidate.expect?.figures ?? [];
    const baseGave = (n: number) => base.filter((b) => b.turns.some((t) => extractNumericClaims(t.reply).includes(n))).length > base.length / 2;
    const replyFigures = candidate.turns.flatMap((t) => extractNumericClaims(t.reply));
    const missing = expected.filter((n) => baseGave(n) && !replyFigures.includes(n));
    if (missing.length) findings.push({ status: 'FALLA', criterion: 'cifras', detail: `la mayoría de la base daba ${missing.join(', ')} y el candidato no` });
  }
  return findings.length ? findings : [{ status: 'PASA', criterion: 'cifras', detail: '' }];
}

// 3. Misma decisión de handoff (y mismo disparador) que la mayoría de la base.
function checkHandoff(base: ItemRecord[], candidate: ItemRecord): Finding {
  const baseDecision = majority(base.map(handedOff));
  const baseTrigger = majority(base.map(triggerOf));
  const decision = handedOff(candidate);
  if (decision !== baseDecision) {
    return { status: 'FALLA', criterion: 'handoff', detail: `base: ${baseDecision ? 'handoff' : 'sin handoff'}; candidato: ${decision ? 'handoff' : 'sin handoff'}` };
  }
  if (decision && triggerOf(candidate) !== baseTrigger) {
    return { status: 'FALLA', criterion: 'handoff', detail: `disparador base: ${baseTrigger}; candidato: ${triggerOf(candidate)}` };
  }
  const expected = candidate.expect?.handoff;
  if (expected !== undefined && expected !== decision) {
    return { status: 'REVISAR', criterion: 'handoff', detail: `igual a la base, pero la suite esperaba ${expected ? 'handoff' : 'sin handoff'}` };
  }
  return { status: 'PASA', criterion: 'handoff', detail: '' };
}

// 4. Ninguna mención a una tool vigilada (guardedTools en harness.config.json).
function checkNoTool(candidate: ItemRecord): Finding {
  const mention = TOOL_NAMES !== null && candidate.turns.some((t) => TOOL_NAMES.test(t.reply));
  return mention
    ? { status: 'FALLA', criterion: 'tool', detail: 'la respuesta nombra una tool vigilada' }
    : { status: 'PASA', criterion: 'tool', detail: '' };
}

// 5. Sanidad: respuesta no vacía y de un largo comparable.
function checkSanity(base: ItemRecord[], candidate: ItemRecord): Finding {
  const length = candidate.turns.reduce((sum, t) => sum + t.reply.length, 0);
  if (candidate.turns.some((t) => !t.reply.trim())) return { status: 'FALLA', criterion: 'sanidad', detail: 'respuesta vacía' };
  const baseMedian = median(base.map((b) => b.turns.reduce((sum, t) => sum + t.reply.length, 0)));
  if (baseMedian && (length > baseMedian * LENGTH_RATIO_LIMIT || length < baseMedian / LENGTH_RATIO_LIMIT)) {
    return { status: 'REVISAR', criterion: 'sanidad', detail: `largo ${length} frente a una mediana base de ${baseMedian}` };
  }
  return { status: 'PASA', criterion: 'sanidad', detail: '' };
}

export interface ItemResult { id: string; category: string; status: Status; findings: Finding[] }

export function compareItem(base: ItemRecord[], candidates: ItemRecord[], promptFigures: number[]): ItemResult {
  const findings = candidates.flatMap((candidate) => [
    checkSources(base, candidate),
    ...checkFigures(candidate, promptFigures, base),
    checkHandoff(base, candidate),
    checkNoTool(candidate),
    checkSanity(base, candidate),
  ].map((f) => ({ ...f, detail: f.detail && `r${candidate.run}: ${f.detail}` })));
  const nonPassing = findings.filter((f) => f.status !== 'PASA');
  return { id: candidates[0].id, category: candidates[0].category, status: worst(findings.map((f) => f.status)), findings: nonPassing };
}

// Diferencias de procedencia que invalidan la comparación (algo cambió además del código).
export function compareProvenance(base: RunFile['provenance'], candidate: RunFile['provenance']): Finding[] {
  const findings: Finding[] = [];
  const same = (label: string, a: unknown, b: unknown, status: Status = 'FALLA') => {
    if (JSON.stringify(a) !== JSON.stringify(b)) findings.push({ status, criterion: 'procedencia', detail: `${label} distinto entre base y candidato` });
  };
  same('agente', base.agent.id, candidate.agent.id);
  same('hash de la config del agente', base.agent.configHash, candidate.agent.configHash);
  same('defaults de plataforma', base.defaultsHash, candidate.defaultsHash);
  same('diales del runtime', base.dials, candidate.dials);
  same('chunks por fuente', base.chunksBySource, candidate.chunksBySource);
  same('suite', base.suite.sha256, candidate.suite.sha256);
  same('modelo del reranker', base.reranker, candidate.reranker);
  for (const tool of GUARDED_TOOLS.filter((t) => candidate.agent.toolsEnabled.includes(t))) {
    findings.push({ status: 'FALLA', criterion: 'procedencia', detail: `el candidato tiene ${tool} habilitada (tool vigilada)` });
  }
  if (!base.invariantVsBase) findings.push({ status: 'FALLA', criterion: 'procedencia', detail: `la línea base no corrió sobre ${base.baseSha}` });
  if (base.gitDirty || candidate.gitDirty) findings.push({ status: 'REVISAR', criterion: 'procedencia', detail: 'alguna corrida tenía cambios sin commitear' });
  return findings;
}
