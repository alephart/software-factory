---
tags: [plan, decision, agenttia, conversion-chat]
creado: 2026-11-07
estado: por-decidir
---

# Separar CC y Agenttia (punto 3 del orden del 07/11)

Volver a [[00-estado-actual]] · Base: [[fabrica-y-productos]] (principio de entrega) · Antecedente: [[plan-separacion-infra]] (05/10, REQUEST-8)

> **Para la sesión del 08/11.** Salida esperada: un ADR en `conversion-platform` (siguiente número libre: **040**) que diga
> qué es de CC, qué se entrega si termina la alianza y cómo pasa a Agenttia lo que evoluciona en CC.
> El punto 4 (repo, staging y workspace de Railway de Agenttia) se ejecuta después, contra ese ADR.
> Trabajo de decisión: traer opciones y trade-offs; decide Juan Carlos.

## Lo que ya está decidido

- CC se separa de Agenttia aunque sea una vertical suya: por el convenio inicial, si termina la alianza **CC se entrega**.
  Lo que evolucione en CC sigue pasando a Agenttia, "con matices" (Juan Carlos, 07/11).
- Principio de entrega (12/10): CC se opera sin la fábrica y sin ajustes; copiar, no enlazar; cuentas e infraestructura propias por producto.
- Código (04/10): la rama `stage` de CC es la base de Agenttia v2, en un repo propio.
  Regla del puente (21/10): los fixes van de CC a Agenttia, nunca al revés.
- GitHub (24/10): CC se queda en la cuenta personal `alephart`; la fábrica y Agenttia, en `Alephart-Co`.
- Supabase (noviembre): org **Conversion** (Pro) = producción de CC; org **Agenttia** (Free, pasa a Pro para producción) = `Agenttia-platform`;
  org **Agenttia-stage** (Free) = `cc-staging` y `agenttia-staging` (el antiguo `conversion-chat-staging`, mismo ref).
- Railway (06/11, inclinación): workspace nuevo **Agenttia** (Hobby) con producción y staging. El environment `staging` del proyecto
  Conversion ya corre la versión nueva de Agenttia.

## Dónde siguen mezclados (07/11)

| Recurso | Hoy | Problema para la entrega |
|---|---|---|
| Repo `alephart/conversion-platform` | Tiene la rama `stage` (Agenttia v2) | Entregar el repo entrega el código de Agenttia. Borrar la rama no basta: los PRs contra `stage` dejan sus commits en `refs/pull/*` de GitHub |
| Railway, proyecto Conversion | Environment `staging` = Agenttia; despliega por CLI desde `stage` y lee `apps/agent/railway.toml` | Producto mezclado y, además, deja de funcionar el **2026-12-01** (REQUEST-9) |
| Supabase `cc-staging` | En la org Agenttia-stage | El staging de CC vive en una org de Agenttia: para entregarlo hay que moverlo a una org de CC |
| Plane | CC PLATFORM-60 (arranque de Agenttia) en el workspace de CC | Trabajo de Agenttia en el seguimiento de CC |
| Cloudflare, dominios, Resend, Google OAuth, Meta/WhatsApp, llaves de LLM | Sin inventario por producto desde la auditoría del 04/10 | No está escrito qué cuenta es de quién |

## Preguntas para el ADR

1. **¿CC corre sobre Agenttia o al lado?** Hasta ahora se dijo que CC es la primera vertical de Agenttia. Si CC llega a correr
   sobre la plataforma de Agenttia, entregar CC obligaría a entregar Agenttia. Hay que elegir: CC mantiene su propio runtime
   (y Agenttia copia lo que sirve), o CC migra a Agenttia y el convenio dice cómo se entrega. Esta respuesta decide las demás.
2. **¿Qué es exactamente "lo que se entrega"?** Repo e historial, cuentas (cuáles se transfieren y cuáles se crean nuevas), datos de
   clientes, dominios, números de WhatsApp. Conviene una lista verificable, como la "prueba de entrega" de [[fabrica-y-productos]].
3. **¿Cómo pasa una mejora de CC a Agenttia?** Opciones: portarla a mano citando el commit de CC; cherry-pick desde un remoto;
   paquete compartido (choca con "copiar, no enlazar"). Qué son los "matices": qué no pasa (datos de clientes, prompts por cliente,
   integraciones propias de CC).
4. **¿Y al revés?** Hoy es "nunca de Agenttia a CC". Si Agenttia mejora el núcleo (RAG, memoria, handoff), ¿CC se queda sin esas
   mejoras o hay un camino controlado?
5. **¿De quién es el código?** Agenttia nace del código de CC (`stage`). Si el convenio no lo dice, es un riesgo. Se revisa con el
   convenio en la mano (y con un abogado si hace falta); el ADR solo lo referencia.
6. **Orden de la mudanza y fechas:** qué sale primero del repo y de las cuentas de CC (rama `stage`, environment `staging` de Railway,
   `cc-staging` de Supabase, PLATFORM-60). La fecha dura es el **2026-12-01** para el environment `staging`.

## Insumos para leer al empezar

- [[fabrica-y-productos]] (principio de entrega y brechas del 12/10) y [[plan-separacion-infra]] (decisiones D1–D5 del 05/10;
  su bloque 3, Agenttia, sigue pendiente en CC PLATFORM-60).
- En `conversion-platform`: `docs/ENVIRONMENTS.md`, ADR 036 (cc-staging y ramas) y ADR 039 (runtime de Railway en el gate de CI).
- Plane: CC PLATFORM-60 y REQUEST-9 (abierto por el staging de Agenttia).
