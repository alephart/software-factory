import { z } from 'zod';

// Suite de regresión por agente (la escribe y aprueba el dueño de producto). Sin datos personales:
// preguntas de un contacto ficticio. Ver README.md.
// normal: el agente sí responde · out_of_scope: no le corresponde (no diagnostica, no receta,
// no cotiza lo que no vende) · advisor: debe remitir a un asesor · figure_*: cifra que sí o
// no está en su conocimiento.
export const QUESTION_CATEGORIES = [
  'normal',
  'out_of_scope',
  'advisor',
  'figure_not_in_knowledge',
  'figure_in_knowledge',
] as const;

export const SuiteSchema = z.object({
  agent: z.string().min(1),
  version: z.number().int().positive(),
  author: z.string().min(1),
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        category: z.enum(QUESTION_CATEGORIES),
        text: z.string().min(1),
        // Lo que el agente debería hacer según quien escribió la suite. El arnés no lo evalúa
        // (compara contra la línea base); es la guía para la revisión humana.
        expectedAction: z.string().optional(),
        expect: z
          .object({
            handoff: z.boolean().optional(),
            // Cifras que la respuesta debe dar (figure_in_knowledge) o no confirmar
            // (figure_not_in_knowledge), en pesos y sin separadores: 495000.
            figures: z.array(z.number().int().positive()).optional(),
            mustNotConfirm: z.array(z.number().int().positive()).optional(),
          })
          .optional(),
      }),
    )
    .min(6)
    .max(12),
  conversations: z
    .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), turns: z.array(z.string().min(1)).min(2).max(4) }))
    .max(2)
    .optional(),
});
export type Suite = z.infer<typeof SuiteSchema>;

export interface RetrievedChunk {
  id: string;
  score: number;
  source: string | null;
  documentId: string | null;
  chunkIndex: number | null;
  // Pasó el umbral de relevancia del reranker (lo que de verdad le llegó al modelo).
  relevant: boolean;
  figures: number[];
}

export interface TurnRecord {
  user: string;
  reply: string;
  ragCalls: { query: string; chunks: RetrievedChunk[] }[];
  handoff: { mode: string; triggeredBy: string | null } | null;
}

export interface ItemRecord {
  kind: 'question' | 'conversation';
  id: string;
  category: (typeof QUESTION_CATEGORIES)[number] | 'conversation';
  expect?: Suite['questions'][number]['expect'];
  run: number;
  turns: TurnRecord[];
  // En prod, después de un handoff el bot deja de responder (lo corta el controlador): el
  // arnés llama process() directo, así que corta la conversación él mismo.
  cutByHandoff: boolean;
}

export interface Provenance {
  phase: string;
  startedAt: string;
  gitSha: string;
  gitBranch: string;
  gitDirty: boolean;
  baseSha: string;
  // git diff BASE_SHA..HEAD vacío en apps/*/src, packages y supabase/migrations.
  invariantVsBase: boolean;
  migrationFiles: number;
  suite: { agent: string; version: number; author: string; sha256: string };
  agent: {
    id: string;
    name: string;
    model: string;
    toolsEnabled: string[];
    configHash: string;
    promptSha256: string;
    ragMinRelevantScore: number;
  };
  defaultsHash: string;
  // Cifras que el agente puede dar sin RAG: su system_prompt y el de plataforma.
  promptFigures: number[];
  dials: Record<string, string | null>;
  reranker: { model: string; dtype: string };
  chunksBySource: Record<string, number>;
  runsPerItem: number;
}

export interface RunFile {
  provenance: Provenance;
  items: ItemRecord[];
}
