---
tags: [modelo, diagramas, factory]
creado: 2026-11-06
actualizado: 2026-11-07
---

# Diagramas de la fábrica

Volver a [[README]] · Plan: [[plan-fabrica-2026-10-24]] · Costo: [[costo-por-item-2026-11-02]] · Estado: [[00-estado-actual]]

> **Versión visual (la que se usa para explicar):** lienzo de Claude Design «Software Factory · diagramas» —
> https://claude.ai/artifact/AwAuCkjgLVqRpcatthcU7j (01 Cómo funciona hoy · 02 Avance del plan · 03 A, B, C y D · 04 Seguridad y equipo rojo).
> Esta nota guarda las mismas ideas en Mermaid para leerlas dentro del vault. Estado al 07/11. El lienzo y esta nota no se sincronizan solos: al cambiar uno, actualizar el otro.

## 01 · Cómo funciona hoy

Un issue va de Plane al merge pasando por cinco skills propias. Ninguna etapa avanza sola: cada paso entre etapas lo da una persona, y el merge también.

```mermaid
flowchart TB
  subgraph PLANE["Plane · producto decide el qué y el si"]
    P1["Solicitud en Intake<br/>AG INBOX · CC REQUEST"]:::human
    P2{"Triage de producto<br/>¿va por la Factory?"}:::human
    P1 --> P2
  end
  P2 -- "destino:persona o decision" --> PX["Lo resuelve una persona<br/>fuera de la Factory"]:::neutral
  P2 -- "destino:factory" --> G1

  subgraph GH["GitHub · factory-sandbox, repo de prueba"]
    G1["Issue con origen:plane"]:::artifact
    TR["Solo autores con write, maintain o admin<br/>despiertan a la Factory · las skills ignoran<br/>comentarios de autores no confiables"]:::guard
  end
  TR -.-> G1

  subgraph WORK["Tablero Work · factory.alephart.co en Railway"]
    W1["Tarjeta en Intake"]:::artifact
    T1["factory-triage<br/>publica el triage · máx. 400 palabras"]:::agent
    H1(["Persona responde las preguntas<br/>en un comentario nuevo"]):::human
    H2(["Persona mueve a Planning<br/>= aprueba el triage"]):::human
    PL["factory-plan<br/>plan vN en el issue y en docs/tasks"]:::agent
    H4(["Persona abre una sesión nueva<br/>con otro modelo"]):::human
    PR["factory-plan-review<br/>solo lee · máx. 500 palabras"]:::agent
    V{"Veredicto del plan"}:::gate
    H5(["Persona pide el plan vN+1<br/>en la sesión de la tarjeta"]):::human
    H3(["Persona pulsa Build"]):::human
    GATE1{{"Gate del tablero<br/>¿tiene plan:aprobado?"}}:::gate
    REJ["Transición rechazada"]:::neutral
    B["Builder de Mastra<br/>implementa el último plan y abre el PR"]:::agent
  end
  SB["Sandbox local con HOME propio<br/>sin aislamiento real · E2B pendiente"]:::risk
  G1 --> W1 -- "Investigate" --> T1 --> H1 --> H2 --> PL --> H4 --> PR --> V
  V -- "AJUSTAR o REPLANTEAR" --> H5 --> PL
  V -- "APROBAR y pone la etiqueta" --> H3 --> GATE1
  GATE1 -- "no" --> REJ
  GATE1 -- "sí" --> B
  B -. "corre en" .- SB

  subgraph REV["Tablero Review · la tarjeta la crea el webhook"]
    R1["factory-review<br/>Verdict + Reviewed head"]:::agent
    R2{"¿approve?"}:::gate
    RB["El builder corrige y empuja"]:::agent
    RR["factory-rereview"]:::agent
    FV{{"Check factory-verdict<br/>desde 2 rondas exige además<br/>un Approve humano"}}:::gate
  end
  B --> R1 --> R2
  R2 -- "request changes" --> RB --> RR --> R2
  R2 -- "approve" --> FV
  FV --> M(["Merge humano"]):::human --> DN["Done · tarjetas cerradas"]:::done

  classDef human fill:#fdecc8,stroke:#b7791f,color:#3b2a06
  classDef agent fill:#dbeafe,stroke:#2563eb,color:#0b2447
  classDef gate fill:#fde2e1,stroke:#c0392b,color:#4a1410,stroke-width:2px
  classDef artifact fill:#eef1f4,stroke:#7b8794,color:#1f2933
  classDef guard fill:#dcf5e7,stroke:#1f8a52,color:#0c3a22
  classDef risk fill:#fff1f0,stroke:#c0392b,color:#4a1410,stroke-dasharray:5 3
  classDef neutral fill:#f5f6f8,stroke:#a0a9b4,color:#3e4c59
  classDef done fill:#c9efd9,stroke:#1f8a52,color:#0c3a22,stroke-width:2px
```

*Flujo actual de Plane a Done en factory-sandbox, con las decisiones humanas y los gates de máquina.*

## 02 · Avance del plan hasta la meta

Los bloques 1 y 2, las pruebas de 1A y el 3.1 de CC están cerrados. Lo que sigue, en el orden del 07/11: separar CC y Agenttia, montar el repo y los entornos de Agenttia, la fase 4 (E2B) y E1. La meta es el primer ítem de Agenttia hecho por la Factory con aislamiento real.

> Estado revisado el 07/11 en el repo de CC, Railway y Plane.

```mermaid
flowchart TB
  subgraph FAB["Fábrica · FACTORY-11"]
    B0["Bloque 0 · Higiene<br/>límites de interacción ✓ · regla de confianza ✓<br/>falta: proyecto SANDBOX, labels destino, invitar a Nicole"]:::partial
    B1["Bloque 1 · Servidor en Railway ✓<br/>29/10 · issue 19 → PR 20 → Done<br/>con el bot de producción"]:::done
    B2["Bloque 2 · Gate completo ✓<br/>02/11 · request changes en vivo<br/>y tope de rondas con persona"]:::done
    B0 --> B1 --> B2
  end

  subgraph COST["FACTORY-12 · bajar el costo por ítem · USD 4,86 tras la 1A"]
    F1["1A · Reviews propias y cortas,<br/>skills en inglés, presupuesto de largo<br/>PR 12 fusionado"]:::done
    F1b["Pruebas de 1A ✓<br/>issue 24 · USD 4,86 · −29%"]:::done
    F2["2 · Modelo por etapa<br/>contribuir código a Mastra"]:::todo
    F3["3 · Carril express = A"]:::todo
    F4["4 · Memoria observacional"]:::todo
    F1 --> F1b --> F2 --> F3 --> F4
  end
  B2 --> F1

  subgraph CC["Bloque 3 · CC, por su propio flujo"]
    direction TB
    C1["3.1 · staging ✓ 07/11<br/>cc-agent ← cc-stage con Wait for CI"]:::done
    C1P["3.1 · producción ✓ 07/11<br/>agent ← master con Wait for CI"]:::done
    CZ["Congelado 23–28/11<br/>congreso de EMA · autodeploy apagado"]:::hard
    C9["1/12 · fin de Config as Code<br/>falta el staging de Agenttia · REQUEST-9"]:::hard
    C2["3.2 · Sentry en apps/agent<br/>sin fecha"]:::todo
    E1N["6 · E1 · escáneres<br/>de seguridad en CI"]:::todo
    C1 --> C1P --> CZ --> C9
    C1P --> C2
  end

  subgraph F4B["Bloque 4 · Agenttia y fase 4 · orden del 07/11"]
    SEP["3 · Separar CC y Agenttia<br/>ADR 040 · siguiente, 08/11"]:::active
    AR["4 · Agenttia: repo en Alephart-Co,<br/>staging y workspace en Railway"]:::todo
    E2B["5 · E2B · aislamiento real<br/>alternativas de costo por revisar"]:::todo
    BK["4.1b · Respaldo diario<br/>de la base a R2"]:::todo
    TM["4.3 · GitHub Team + ruleset<br/>factory-verdict sin bypass"]:::todo
    AP["4.4 · App de la Factory<br/>en el repo de Agenttia"]:::todo
    SEP --> AR --> TM --> AP
    AR --> E2B --> AP
  end
  C1P --> SEP
  AR -. "saca el staging de Agenttia<br/>antes del 1/12" .-> C9
  E2B -. "después" .-> E1N
  B2 --> BK

  GOAL(["META · un ítem de Agenttia recorre<br/>Plane → Factory → merge con factory-verdict<br/>obligatorio y aislamiento real"]):::goal
  AP --> GOAL

  B5["Bloque 5 · cuando el volumen lo pida<br/>skills puente Plane, Plane Pro, MCP curado, Seer"]:::later
  GOAL -.-> B5

  classDef done fill:#c9efd9,stroke:#1f8a52,color:#0c3a22,stroke-width:2px
  classDef partial fill:#e6f4d7,stroke:#5f8a1f,color:#24360a,stroke-dasharray:5 3
  classDef active fill:#fdecc8,stroke:#b7791f,color:#3b2a06,stroke-width:2px
  classDef todo fill:#eef1f4,stroke:#7b8794,color:#1f2933
  classDef hard fill:#fde2e1,stroke:#c0392b,color:#4a1410,stroke-width:2px
  classDef goal fill:#d6f0f0,stroke:#0f6e6e,color:#06302f,stroke-width:3px
  classDef later fill:#f5f6f8,stroke:#a0a9b4,color:#3e4c59,stroke-dasharray:3 3
```

*Bloques del plan del 24/10 con su estado y dependencias, hasta la meta de la fase 4.*

```mermaid
gantt
  title Calendario del plan, fechas del vault
  dateFormat YYYY-MM-DD
  axisFormat %d/%m
  section Fábrica
    Bloque 1 · servidor en Railway       :done, b1, 2026-10-26, 2026-10-29
    Bloque 2 · gate completo             :done, b2, 2026-10-29, 2026-11-02
    FACTORY-12 1A fusionado              :done, f12, 2026-11-02, 1d
    Bloque 4 · E2B y Agenttia, diciembre sin fecha fija :b4, 2026-11-09, 2026-12-31
  section Agenttia
    Separar CC y Agenttia arranca        :milestone, sep, 2026-11-08, 0d
    Staging de Agenttia fuera de Conversion :crit, agst, 2026-11-08, 2026-12-01
  section CC
    3.1 Railway en staging               :done, c1s, 2026-10-26, 2026-11-07
    3.1 Railway en producción            :done, c1p, 2026-11-07, 1d
    Autodeploy de producción apagado     :crit, off, 2026-11-22, 2026-11-29
    Congelado por el congreso de EMA     :crit, frz, 2026-11-23, 2026-11-28
    REQUEST-9 vence                      :milestone, crit, r9, 2026-12-01, 0d
    3.2 Sentry si no alcanza antes       :c2, 2026-12-01, 2026-12-31
```

*Solo las fechas que están escritas en el vault. El bloque 4 no tiene fecha fija: el plan dice «Agenttia en diciembre».*

## 03 · Qué se logra con A, B, C y D

Las cuatro piezas que se toman de ECC se enchufan en etapas que ya existen; ninguna crea un pipeline paralelo. Cada una trae su logro y su prioridad en el orden acordado.

```mermaid
flowchart TB
  TRI["factory-triage"]:::agent --> PLN["factory-plan"]:::agent --> PRV["factory-plan-review"]:::agent --> BLD["Build"]:::agent --> REV["factory-review<br/>y factory-rereview"]:::agent --> MRG(["Merge humano"]):::human

  A["A · prioridad 2<br/>Clasificar el tamaño en el triage<br/>puntos · contrato o dependencia nueva · ambigüedad"]:::proposal
  AL["Logro A · menos costo y tiempo<br/>en los ítems pequeños"]:::outcome
  A -.-> TRI
  A --- AL
  PLN -- "carril express · ≤ 2 puntos" --> HX(["Persona pone plan:aprobado<br/>sin revisión del plan"]):::human --> BLD

  B["B · prioridad 5<br/>Disciplina en el build: un bug se reproduce<br/>con una prueba que falla y se verifica antes del PR<br/>skill propia si Mastra lo permite, si no vía AGENTS.md"]:::proposal
  BL["Logro B · menos rondas<br/>de request changes"]:::outcome
  B -.-> BLD
  B --- BL

  C["C · prioridad 4<br/>Listas por stack en references/<br/>Supabase y RLS · RAG · React Native · Cloudflare<br/>se cargan solo si el diff toca el área"]:::proposal
  CL["Logro C · más hallazgos de dominio<br/>sin inflar cada review"]:::outcome
  C -.-> REV
  C --- CL

  REV -- "hallazgos" --> D["D · prioridad 7, necesita historial<br/>Registro de hallazgos: el que se repite<br/>se vuelve regla o chequeo"]:::proposal
  D -. "regla nueva" .-> BLD
  D -. "chequeo nuevo" .-> REV
  DL["Logro D · errores repetidos se vuelven<br/>chequeos automáticos · nivel 3 de madurez"]:::outcome
  D --- DL

  classDef agent fill:#dbeafe,stroke:#2563eb,color:#0b2447
  classDef human fill:#fdecc8,stroke:#b7791f,color:#3b2a06
  classDef proposal fill:#ffffff,stroke:#0f6e6e,color:#06302f,stroke-width:2px,stroke-dasharray:6 3
  classDef outcome fill:#d6f0f0,stroke:#0f6e6e,color:#06302f
```

*Dónde entra cada pieza en el flujo y qué logra. B depende de si Mastra deja reemplazar el builder.*

## 04 · Seguridad: lo que hay, lo que falta y la propuesta

Las defensas actuales son pasivas. La propuesta E agrega un equipo rojo en tres capas, de la más barata a la más cara. Sus reportes entran por el Intake privado y cada falla encontrada se queda como prueba de regresión.

```mermaid
flowchart LR
  subgraph HOY["Defensas que ya existen"]
    direction TB
    S1["Solo autores de confianza activan la Factory<br/>y cuentan como respuesta humana"]:::guard
    S2["La review bloquea inyecciones en el PR<br/>y no corre pruebas que salen a la red<br/>o leen credenciales"]:::guard
    S3["Cero credenciales de producción<br/>solo repos de prueba"]:::guard
    S4["Merge humano + factory-verdict"]:::guard
    S5["Review de tenancy y RLS<br/>RLS probada con otro tenant"]:::guard
  end

  subgraph GAP["Huecos"]
    direction TB
    H1["Sin aislamiento real<br/>del 27/10 al 02/11 corrió como root"]:::risk
    H2["CI sin escaneos<br/>solo typecheck, lint y pruebas"]:::risk
    H3["Agentes conversacionales<br/>sin pruebas de ataque"]:::risk
    H4["Nadie ataca la fábrica"]:::risk
  end

  X1["4.1 · E2B"]:::todo
  X2["E1 · escáneres"]:::proposal
  X3["E2 · escenarios de ataque"]:::proposal
  X4["E3 · agente atacante"]:::proposal
  H1 -- "lo cubre" --> X1
  H2 -- "lo cubre" --> X2
  H3 -- "lo cubre" --> X3
  H4 -- "lo cubre" --> X4
  HOY ~~~ GAP

  classDef guard fill:#dcf5e7,stroke:#1f8a52,color:#0c3a22
  classDef risk fill:#fff1f0,stroke:#c0392b,color:#4a1410,stroke-dasharray:5 3
  classDef proposal fill:#ffffff,stroke:#0f6e6e,color:#06302f,stroke-width:2px,stroke-dasharray:6 3
  classDef todo fill:#eef1f4,stroke:#7b8794,color:#1f2933
```

*Lo que ya protege a la fábrica y a los productos, y qué cubre cada hueco.*

```mermaid
flowchart TB
  E2B["4.1 · E2B · aislamiento real"]:::todo
  subgraph PROP["Propuesta E · equipo rojo en tres capas"]
    E1["E1 · Escáneres en CI · prioridad 1<br/>Gitleaks · pnpm audit u osv-scanner · Dependabot<br/>Semgrep · advisors de Supabase"]:::proposal
    E2["E2 · Escenarios de ataque · prioridad 3<br/>sobre kit/harness, solo contra staging<br/>inyección · cruce de clínicas<br/>fuga de prompt o datos · abuso de tools"]:::proposal
    E3["E3 · Agente atacante factory-redteam · prioridad 6<br/>alcance escrito · solo staging<br/>credenciales de solo lectura"]:::proposal
  end
  E2B -- "habilita" --> E3

  FAB["La fábrica<br/>factory-server · sandbox · GitHub App"]:::target
  PRD["Los productos en staging · CC y Agenttia<br/>por su endpoint, nunca por la API de WhatsApp"]:::target
  E1 -- "escanea repos" --> FAB
  E1 -- "escanea repos" --> PRD
  E2 -- "ataca agentes" --> PRD
  E3 -- "ataca" --> FAB
  E3 -- "ataca" --> PRD

  RPT["Reporte privado<br/>repo privado o security advisory<br/>nunca un issue público"]:::artifact
  FAB -- "hallazgos" --> RPT
  PRD -- "hallazgos" --> RPT
  RPT --> INT["Intake → triage → corrección<br/>por el flujo normal de la Factory"]:::agent
  INT --> REG["Cada falla queda como<br/>escenario o regla de regresión"]:::outcome
  REG -. "alimenta" .-> E2

  classDef proposal fill:#ffffff,stroke:#0f6e6e,color:#06302f,stroke-width:2px,stroke-dasharray:6 3
  classDef todo fill:#eef1f4,stroke:#7b8794,color:#1f2933
  classDef target fill:#e8e4f8,stroke:#5b4bb7,color:#1e1650
  classDef artifact fill:#eef1f4,stroke:#7b8794,color:#1f2933
  classDef agent fill:#dbeafe,stroke:#2563eb,color:#0b2447
  classDef outcome fill:#d6f0f0,stroke:#0f6e6e,color:#06302f
```

*Las tres capas, qué atacan y cómo vuelve cada hallazgo al flujo. E3 solo arranca después de E2B.*

## 05 · Orden acordado

Orden de las piezas de ECC y del equipo rojo entre sí. En el orden general del 07/11, E1 va sexto: después de separar CC y Agenttia, montar Agenttia y E2B. En la fábrica, A llega después del modelo por etapa (las pruebas de 1A ya están). E2, B y E3 tienen requisitos que hay que cumplir antes.

```mermaid
flowchart TB
  subgraph CCF["Por el flujo de CC"]
    O1["1 · E1<br/>escáneres en CI"]:::p1
  end
  subgraph FACT["Por la fábrica"]
    PRE["FACTORY-12<br/>pruebas de 1A ✓ → modelo por etapa"]:::todo
    O2["2 · A<br/>carril express"]:::p2
    O3["3 · E2<br/>escenarios de ataque"]:::p2
    O4["4 · C<br/>listas por stack"]:::p3
    O5["5 · B<br/>disciplina en el build"]:::p3
    O6["6 · E3<br/>agente atacante"]:::p3
    O7["7 · D<br/>ciclo de aprendizaje"]:::p3
    PRE --> O2 --> O3 --> O4 --> O5 --> O6 --> O7
  end
  E2B["4.1 · E2B"]:::hard
  E2B -- "requisito" --> O6
  HAR["kit/harness instalado<br/>primera instalación: Agenttia"]:::hard
  HAR -- "requisito" --> O3
  MQ["Leer el código de Mastra:<br/>¿se puede reemplazar el builder?"]:::hard
  MQ -- "requisito" --> O5
  O1 -. "en paralelo" .-> O2

  classDef p1 fill:#0f6e6e,stroke:#0f6e6e,color:#ffffff,stroke-width:2px
  classDef p2 fill:#d6f0f0,stroke:#0f6e6e,color:#06302f,stroke-width:2px
  classDef p3 fill:#ffffff,stroke:#0f6e6e,color:#06302f
  classDef todo fill:#eef1f4,stroke:#7b8794,color:#1f2933
  classDef hard fill:#fde2e1,stroke:#c0392b,color:#4a1410
```

*Los siete ítems en orden, con los requisitos que bloquean a E2, B y E3.*
