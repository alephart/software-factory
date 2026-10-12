import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Configuración del arnés en este repo: harness.config.json, junto a run.ts. Es lo único que cambia
// entre productos que usan el mismo runtime (ver README.md, "Qué se configura").
export const HarnessConfigSchema = z.object({
  // Ref del proyecto de Supabase de staging. El arnés se niega a correr contra cualquier otro.
  stagingSupabaseRef: z.string().min(1),
  // Archivo de credenciales de staging, relativo a la app del agente (ignorado por git).
  envFile: z.string().min(1).default('.env.staging'),
  // Variables que no pueden existir en el entorno del arnés (canales, almacenamiento): nada debe salir hacia afuera.
  forbiddenEnvPrefixes: z.array(z.string().min(1)).default(['WASENDERAPI_', 'META_', 'YCLOUD_', 'R2_']),
  requiredEnv: z.array(z.string().min(1)).default(['SUPABASE_SECRET_KEY', 'OPENAI_API_KEY']),
  // Diales del runtime que se registran en la procedencia: base y candidato deben coincidir.
  dials: z.array(z.string().min(1)).default([
    'RAG_CANDIDATE_COUNT', 'RAG_THRESHOLD', 'RAG_TOP_K', 'RAG_MIN_RELEVANT_SCORE', 'EMBEDDING_MODEL',
    'RERANKER_MODEL', 'RERANKER_DTYPE', 'DEFAULT_LLM_MODEL', 'AGENT_CONFIG_TTL_MS',
  ]),
  // Campos de la config del agente que deciden su comportamiento (forman el hash de configuración).
  configFields: z.array(z.string().min(1)).default([
    'model', 'temperature', 'top_p', 'frequency_penalty', 'presence_penalty', 'max_tokens',
    'system_prompt', 'tools_enabled', 'tool_instructions', 'memory_window', 'debounce_ms',
    'conversation_gap_minutes', 'rag_namespace', 'rag_min_relevant_score', 'knowledge_table',
  ]),
  // Tools vigiladas: el candidato no puede tenerlas habilitadas ni nombrarlas en una respuesta.
  // Útil cuando el cambio prepara una tool que todavía debe estar apagada. Vacío = sin vigilancia.
  guardedTools: z.array(z.string().min(1)).default([]),
  defaultRuns: z.number().int().positive().default(3),
  // Regla del A/B, fijada antes de correr: una métrica difiere si |diferencia| >= minDifference y Fisher p < alpha.
  ab: z.object({ minDifference: z.number().positive().default(0.4), alpha: z.number().positive().default(0.05) }).default({ minDifference: 0.4, alpha: 0.05 }),
});
export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;

export const HARNESS_DIR = join(__dirname, '..');

export function loadConfig(): HarnessConfig {
  const path = join(HARNESS_DIR, 'harness.config.json');
  if (!existsSync(path)) throw new Error(`Falta ${path} (copiar harness.config.example.json y completarlo)`);
  return HarnessConfigSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

// agents.json: alias corto → id del agente en staging. Un alias por suite (<alias>.json).
export function loadAgents(): Record<string, { agentId: string; client?: string }> {
  const path = join(HARNESS_DIR, 'agents.json');
  if (!existsSync(path)) throw new Error(`Falta ${path} (copiar agents.example.json y completarlo)`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
