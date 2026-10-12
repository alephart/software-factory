/**
 * Arnés de regresión: corre la suite de un agente contra staging y guarda cada respuesta con su
 * evidencia (chunks recuperados, handoff) en runs/, ignorado por git.
 *
 * Adaptador para el runtime NestJS + Mastra con tablas platform_*: levanta el contexto Nest ya
 * compilado (dist/ del worktree desde el que se corre) y llama AgentRuntimeService.process()
 * directo. No pasa por ningún canal, así que nada sale hacia WhatsApp. Una sesión nueva por
 * pregunta y por corrida. Solo corre contra el staging de harness.config.json.
 * Si el runtime es otro, este es el único archivo que se reescribe (ver README.md).
 *
 * Uso desde la app del agente, después de `pnpm build`:
 *   npx tsx scripts/regression/run.ts --agent <alias> --phase baseline --base-sha <sha>
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { parseArgs } from 'util';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadAgents, loadConfig } from './lib/config';
import { extractNumericClaims } from './lib/numeric-claims';
import { ItemRecord, Provenance, RetrievedChunk, RunFile, SuiteSchema, TurnRecord } from './lib/types';

const CONFIG = loadConfig();
const APP_DIR = join(__dirname, '..', '..');
const ENV_FILE = join(APP_DIR, CONFIG.envFile);
const RUNS_DIR = join(__dirname, 'runs');
const DEFAULT_RUNS = CONFIG.defaultRuns;
// Variables que no deben existir en el entorno del arnés (canales, almacenamiento).
const FORBIDDEN_ENV_PREFIXES = CONFIG.forbiddenEnvPrefixes;
const DIAL_NAMES = CONFIG.dials;
// Lo que decide el comportamiento del agente, sin los campos que una copia entre entornos cambia a propósito.
const CONFIG_FIELDS = CONFIG.configFields;
// El log de rag_query se escribe sin await (fire-and-forget): se espera a que deje de crecer.
const LOG_SETTLE_MS = 1500;
const LOG_MAX_WAIT_MS = 8000;
const RUNTIME_DEFAULT_MIN_RELEVANT_SCORE = 0.05;

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const canonical = (value: unknown) =>
  JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));
// Código bajo prueba: por defecto este worktree; --code-dir apunta a otro worktree ya compilado
// (p. ej. la rama de producción en el commit base, para un A/B). Los scripts siempre salen de este worktree.
let codeRoot = join(APP_DIR, '..', '..');
const codeAppDir = () => join(codeRoot, 'apps', 'agent');
const git = (command: string) => execSync(`git ${command}`, { cwd: codeAppDir(), encoding: 'utf8' }).trim();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseCli() {
  const { values } = parseArgs({
    options: {
      agent: { type: 'string' },
      phase: { type: 'string' },
      'base-sha': { type: 'string' },
      runs: { type: 'string', default: String(DEFAULT_RUNS) },
      // Otra suite en lugar de <alias>.json (p. ej. _template.json para una prueba de humo).
      suite: { type: 'string' },
      // Ids de preguntas o conversaciones a correr (separados por coma); por defecto toda la suite.
      only: { type: 'string' },
      'code-dir': { type: 'string' },
    },
  });
  if (!values.agent || !values.phase || !values['base-sha']) {
    throw new Error('Uso: run.ts --agent <alias> --phase <baseline|candidate|...> --base-sha <sha> [--runs 3] [--suite <json>] [--only id,id] [--code-dir <worktree>]');
  }
  const runs = Number(values.runs);
  if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs debe ser un entero positivo');
  return {
    alias: values.agent, phase: values.phase, baseSha: values['base-sha'], runs, suitePath: values.suite,
    only: values.only?.split(',').map((id) => id.trim()).filter(Boolean),
    codeDir: values['code-dir'] ? resolve(values['code-dir']) : undefined,
  };
}

function assertSafeEnvironment() {
  if (!existsSync(ENV_FILE)) throw new Error(`Falta ${ENV_FILE}`);
  dotenv.config({ path: ENV_FILE, override: true });
  const host = new URL(process.env.SUPABASE_URL ?? '').hostname;
  if (host !== `${CONFIG.stagingSupabaseRef}.supabase.co`) throw new Error(`Solo corre contra staging (${CONFIG.stagingSupabaseRef}); SUPABASE_URL apunta a ${host}`);
  const forbidden = Object.keys(process.env).filter((name) => FORBIDDEN_ENV_PREFIXES.some((p) => name.startsWith(p)));
  if (forbidden.length) throw new Error(`Variables prohibidas en el entorno del arnés: ${forbidden.join(', ')}`);
  for (const name of CONFIG.requiredEnv) {
    if (!process.env[name]) throw new Error(`Falta ${name} en ${ENV_FILE}`);
  }
}

// El agente que se prueba no puede tener follow-up ni canal: el arnés no debe poder escribirle a nadie.
// Los demás agentes de staging pueden tener canal (p. ej. un cliente probando) porque el cron
// de follow-up, que corre dentro de cualquier contexto Nest, se deja inoperante en neutralizeFollowupScheduler.
async function assertAgentUnderTestCannotReachOutside(db: SupabaseClient, agentId: string) {
  const { data, error } = await db
    .from('platform_agents')
    .select('name, followup_enabled, channels, channel_credentials')
    .eq('id', agentId)
    .single();
  if (error || !data) throw new Error(`No se pudo leer el agente ${agentId}: ${error?.message ?? 'no existe'}`);
  if (data.followup_enabled || Object.keys(data.channels ?? {}).length || Object.keys(data.channel_credentials ?? {}).length) {
    throw new Error(`El agente ${data.name} tiene follow-up o canal en staging: no se corre el arnés sobre él`);
  }
}

// Debe correr ANTES de crear el contexto: sin el método decorado, el scheduler no registra el cron.
function neutralizeFollowupScheduler(requireDist: NodeJS.Require) {
  const { FollowupScheduler } = requireDist('./followup/followup.scheduler');
  FollowupScheduler.prototype.processQueue = async () => undefined;
}

// Defensa en profundidad: ningún cron queda activo en el contexto del arnés.
function assertNoActiveCrons(app: { get: (token: unknown) => unknown }, requireDist: NodeJS.Require) {
  const { SchedulerRegistry } = requireDist('@nestjs/schedule');
  const jobs = [...(app.get(SchedulerRegistry) as { getCronJobs: () => Map<string, { stop: () => void }> }).getCronJobs().values()];
  jobs.forEach((job) => job.stop());
}

async function buildProvenance(db: SupabaseClient, args: ReturnType<typeof parseCli>, agentId: string, suiteRaw: string) {
  const suite = SuiteSchema.parse(JSON.parse(suiteRaw));
  const { data: agent, error } = await db.from('platform_agents').select(`id, name, ${CONFIG_FIELDS.join(', ')}`).eq('id', agentId).single();
  if (error || !agent) throw new Error(`No se encontró el agente ${agentId} en staging`);
  const { data: defaults } = await db.from('platform_agent_defaults').select('default_model, embedding_model, embedding_dimensions, system_prompt').single();
  const { data: sources } = await db.from('platform_agent_knowledge').select('source').eq('agent_id', agentId);
  const chunksBySource = (sources ?? []).reduce<Record<string, number>>((acc, { source }) => {
    const key = source ?? '(sin source)';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const record = agent as unknown as Record<string, unknown>;
  const provenance: Provenance = {
    phase: args.phase,
    startedAt: new Date().toISOString(),
    gitSha: git('rev-parse --short HEAD'),
    gitBranch: git('rev-parse --abbrev-ref HEAD'),
    // Solo el código cuenta: un cambio del editor (.vscode/) no altera lo que se mide.
    gitDirty: git("status --porcelain -- ':(top)apps' ':(top)packages' ':(top)supabase'") !== '',
    baseSha: args.baseSha,
    invariantVsBase: git(`diff --name-only ${args.baseSha} HEAD -- ':(top)apps/*/src' ':(top)packages' ':(top)supabase/migrations'`) === '',
    migrationFiles: readdirSync(join(codeRoot, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).length,
    suite: { agent: suite.agent, version: suite.version, author: suite.author, sha256: sha256(suiteRaw).slice(0, 12) },
    agent: {
      id: agentId,
      name: String(record.name),
      model: String(record.model),
      toolsEnabled: record.tools_enabled as string[],
      configHash: sha256(CONFIG_FIELDS.map((f) => canonical(record[f] ?? null)).join('|')).slice(0, 12),
      promptSha256: sha256(String(record.system_prompt ?? '')).slice(0, 12),
      ragMinRelevantScore:
        (record.rag_min_relevant_score as number | null) ??
        Number(process.env.RAG_MIN_RELEVANT_SCORE ?? RUNTIME_DEFAULT_MIN_RELEVANT_SCORE),
    },
    defaultsHash: sha256(canonical(defaults)).slice(0, 12),
    promptFigures: [
      ...new Set([...extractNumericClaims(String(record.system_prompt ?? '')), ...extractNumericClaims(String(defaults?.system_prompt ?? ''))]),
    ],
    dials: Object.fromEntries(DIAL_NAMES.map((name) => [name, process.env[name] ?? null])),
    reranker: {
      model: process.env.RERANKER_MODEL ?? 'Xenova/bge-reranker-base',
      dtype: process.env.RERANKER_DTYPE ?? 'q8',
    },
    chunksBySource,
    runsPerItem: args.runs,
  };
  return { suite, provenance };
}

async function readRagCalls(db: SupabaseClient, agentId: string, sessionId: string, seenLogIds: Set<number>, minScore: number) {
  let previous = -1;
  let rows: { id: number; payload: { query?: string; chunks?: { id: string; score: number }[] } }[] = [];
  for (let waited = 0; waited <= LOG_MAX_WAIT_MS; waited += LOG_SETTLE_MS) {
    await sleep(LOG_SETTLE_MS);
    const { data } = await db
      .from('platform_runtime_logs')
      .select('id, payload')
      .eq('session_id', sessionId)
      .eq('agent_id', agentId)
      .eq('skill_name', 'rag_query')
      .order('id');
    rows = (data ?? []).filter((row) => !seenLogIds.has(row.id));
    if (rows.length === previous) break;
    previous = rows.length;
  }
  rows.forEach((row) => seenLogIds.add(row.id));

  const ids = [...new Set(rows.flatMap((row) => (row.payload.chunks ?? []).map((c) => c.id)))];
  const { data: chunkRows } = ids.length
    ? await db.from('platform_agent_knowledge').select('id, source, document_id, chunk_index, content').in('id', ids)
    : { data: [] };
  const byId = new Map((chunkRows ?? []).map((c) => [c.id, c]));

  return rows.map((row) => ({
    query: row.payload.query ?? '',
    chunks: (row.payload.chunks ?? []).map((c): RetrievedChunk => {
      const chunk = byId.get(c.id);
      return {
        id: c.id,
        score: c.score,
        source: chunk?.source ?? null,
        documentId: chunk?.document_id ?? null,
        chunkIndex: chunk?.chunk_index ?? null,
        relevant: c.score >= minScore,
        figures: extractNumericClaims(chunk?.content ?? ''),
      };
    }),
  }));
}

async function readHandoff(db: SupabaseClient, agentId: string, sessionId: string) {
  const { data } = await db
    .from('platform_handoff_control')
    .select('mode, triggered_by')
    .eq('session_id', sessionId)
    .eq('agent_id', agentId)
    .maybeSingle();
  return data ? { mode: data.mode as string, triggeredBy: (data.triggered_by as string | null) ?? null } : null;
}

async function main() {
  const args = parseCli();
  assertSafeEnvironment();

  const agents = loadAgents();
  const agentId = agents[args.alias]?.agentId;
  if (!agentId) throw new Error(`Alias desconocido: ${args.alias} (ver agents.json)`);
  const suitePath = args.suitePath ?? join(__dirname, `${args.alias}.json`);
  if (!existsSync(suitePath)) throw new Error(`Falta la suite ${suitePath}`);

  const db = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SECRET_KEY as string);
  await assertAgentUnderTestCannotReachOutside(db, agentId);
  if (args.codeDir) codeRoot = args.codeDir;
  const built = await buildProvenance(db, args, agentId, readFileSync(suitePath, 'utf8'));
  const { provenance } = built;
  const suite = args.only
    ? {
        ...built.suite,
        questions: built.suite.questions.filter((q) => args.only?.includes(q.id)),
        conversations: (built.suite.conversations ?? []).filter((c) => args.only?.includes(c.id)),
      }
    : built.suite;
  if (args.only && !suite.questions.length && !suite.conversations?.length) throw new Error(`--only no coincide con ningún ítem: ${args.only.join(', ')}`);

  const requireDist = createRequire(join(codeAppDir(), 'dist', 'main.js'));
  const { NestFactory } = requireDist('@nestjs/core');
  const { AppModule } = requireDist('./app.module');
  const { AgentRuntimeService } = requireDist('./agent/agent-runtime.service');
  neutralizeFollowupScheduler(requireDist);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  assertNoActiveCrons(app, requireDist);
  const runtime = app.get(AgentRuntimeService);
  const runId = Date.now();
  const seenLogIds = new Set<number>();

  const runTurns = async (sessionId: string, messages: string[]) => {
    const turns: TurnRecord[] = [];
    for (const user of messages) {
      const result = await runtime.process(agentId, sessionId, user, 'web');
      const handoff = await readHandoff(db, agentId, sessionId);
      turns.push({
        user,
        reply: (result.bubbles as string[]).join('\n'),
        ragCalls: await readRagCalls(db, agentId, sessionId, seenLogIds, provenance.agent.ragMinRelevantScore),
        handoff,
      });
      if (handoff?.mode === 'owner') return { turns, cutByHandoff: turns.length < messages.length };
    }
    return { turns, cutByHandoff: false };
  };

  const items: ItemRecord[] = [];
  try {
    for (let run = 1; run <= args.runs; run++) {
      for (const question of suite.questions) {
        const sessionId = `regression_${args.phase}_${runId}_${question.id}_r${run}`;
        const { turns, cutByHandoff } = await runTurns(sessionId, [question.text]);
        items.push({ kind: 'question', id: question.id, category: question.category, expect: question.expect, run, turns, cutByHandoff });
        console.log(`  r${run} ${question.id}: ${turns[0].handoff ? 'handoff' : 'ok'}`);
      }
      for (const conversation of suite.conversations ?? []) {
        const sessionId = `regression_${args.phase}_${runId}_${conversation.id}_r${run}`;
        const { turns, cutByHandoff } = await runTurns(sessionId, conversation.turns);
        items.push({ kind: 'conversation', id: conversation.id, category: 'conversation', run, turns, cutByHandoff });
        console.log(`  r${run} ${conversation.id}: ${turns.length} turnos${cutByHandoff ? ' (cortada por handoff)' : ''}`);
      }
    }
  } finally {
    await app.close();
  }

  const outDir = join(RUNS_DIR, args.alias);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${args.phase}-${provenance.startedAt.replace(/[:.]/g, '-')}.json`);
  const runFile: RunFile = { provenance, items };
  writeFileSync(outPath, JSON.stringify(runFile, null, 2));
  console.log(`\n${items.length} ítems → ${outPath}`);
  if (args.phase === 'baseline' && !provenance.invariantVsBase) {
    console.warn(`AVISO: la línea base no corre sobre ${args.baseSha}: el código difiere en src/packages/migraciones`);
  }
  if (provenance.gitDirty) console.warn('AVISO: el árbol tiene cambios sin commitear');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
