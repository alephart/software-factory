---
tags: [diagnostico, articulo-ready]
creado: 2026-09-28
anonimizado: true
---

# Problemas actuales, etapa por etapa

Volver a [[README]] · Ver también [[roles-actuales]] · Modelo: [[escalera-de-madurez]]

> Versión anonimizada, apta para el artículo: sin nombres de clientes, empresas ni claves de herramientas.

## Diagnóstico general

La madurez es **desigual entre etapas**. Planning opera cerca de un nivel 4 (ADR antes de implementar, specs detalladas, prompts de bootstrap para agentes de código). Review y Done siguen en nivel 2 o menos: la verificación la hace un humano a ojo o el cliente en producción. Los agentes producen a velocidad de nivel 4 sin la maquinaria de verificación que ese nivel exige. Ese es el parecido real con "saltar a la dark factory".

## Intake

El trabajo entra por varios canales: conversaciones con clientes, soporte, ventas, prospectos institucionales, ideas técnicas y bugs reportados por el cliente final. No hay cola única ni plantilla. Las necesidades del cliente llegan como relato oral, sin formato "problema / evidencia / impacto". No se puede medir cuánto trabajo entra, de qué tipo es ni cuánto tarda.

## Triage

Existe, pero depende de la intuición. Hay casos resueltos muy bien (una falla atribuida al RAG resultó ser un problema de prompt con datos estructurados), pero esa clasificación no se volvió criterio estándar. No hay categoría de causa raíz ni prioridad explícita, y no se distingue entre problema de plataforma y problema del agente de un cliente específico.

## Planning

Etapa más madura: ADR antes de implementar, fuente de verdad para los agentes de código, contexto por capas. El problema es de flujo: **se abren más decisiones de las que se cierran**. ADRs a medio implementar, ADRs esperando decisión, aprendizajes que no vuelven a la especificación. Los desacuerdos de producto entre personas del equipo se resuelven en el camino y no en un gate de especificación (ej.: formularios estructurados vs. bloques curados de conocimiento).

## Building

Agentes de código con buen contexto, pero sin salvaguardas automáticas. Errores repetidos, como asumir la estructura de la base de datos en migraciones. Sin aislamiento para trabajo en paralelo (hoy no duele; dolerá con más personas o más agentes).

## Review

El eslabón más débil. Se revisa el código, **no el comportamiento del agente conversacional**. Sin escenarios de prueba antes de desplegar, las fallas las descubre el cliente final (ofrecer citas fuera de cobertura, horas en zona horaria equivocada). La revisión de contenido que hace producto es valiosa pero manual, sin registro reutilizable, y no se repite en el siguiente cambio.

## Done

No hay Definition of Done. Estados que quedan abiertos indefinidamente: "implementado parcialmente", "cliente conectado pero sin activar", "funciona pero falta la interfaz". Nadie es dueño de cerrar.

## Operación / Soporte (etapa que falta en el flujo)

El soporte a ventas y clientes lo hace la misma persona que cura contenido y trae requerimientos. Lo aprendido en soporte no se registra de forma estructurada. Las conversaciones reales —la mejor fuente de pruebas— no se convierten en escenarios, y la misma pregunta de soporte puede repetirse sin que nadie lo sepa.

## Transversal: dos fábricas mezcladas

- **Fábrica de plataforma:** monorepo, runtime del agente, portal, agenda, integraciones de mensajería. Ingeniería con ADRs, código y migraciones.
- **Fábrica de agentes:** cada clínica o cirujano es un producto que se fabrica: curación de conocimiento, prompts, cobertura, agenda, handoff, validación y activación. Adaptar la estructura de clínicas a un cliente de catálogo de productos, sin tocar el sistema, demostró que es una línea de ensamblaje reconfigurable.

Ambas comparten hoy un mismo flujo informal, con ritmos, riesgos y responsables distintos.
