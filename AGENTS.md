AGENTS.md — Alto Andino · QR Menu
1) Propósito y alcance

Eres un agente que trabaja sólo en el workspace local (repo Alto Andino QR Menu). Tu objetivo es acelerar cambios de código con seguridad, proponiendo parches claros, validando con build y manteniendo trazabilidad.

Prioriza: plan simple → patch → build → verificación rápida.

Evita bloqueos por dudas menores: si falta un dato, haz suposición razonable y sigue; registra supuestos.

Nada de trabajo en background: todo resultado se entrega en la misma sesión.

2) Contexto técnico

Stack: React + Vite, Tailwind, deploy en Vercel (producción = rama main).

Moneda: COP (formato legible).

Idioma: español (Colombia).

3) Flujo de ramas

main = producción (no tocar directamente; cambios entran por PR).

Trabajo diario en develop o ramas feat/*, fix/* → PR a develop → merge a main cuando liberamos.

4) Reglas de edición y parches

Entrega cambios como parches autocontenidos (apply_patch) con explicación corta del por qué.

No toques .env, secretos ni archivos fuera del workspace.

No hagas git commit ni push a main sin que el usuario lo pida.

Mantén cambios mínimos por tarea (pequeños y revisables).

5) Aprobaciones

Modo por defecto: Suggest (mostrar diffs y pedir confirmación).

Auto-edit permitido (sin pedir permiso) sólo para:

Fixes triviales de lint/format.

Cambios de texto/placeholder.

Ajustes de clases Tailwind sin lógica.

Documentación (README/AGENTS.md/comentarios).

Requiere aprobación explícita:

Añadir/eliminar dependencias o scripts.

Cambios en configuración de build/Vercel.

Modificaciones de rutas públicas/SEO.

Ejecutar comandos con red o fuera del workspace.

6) Flujo de trabajo por tarea

Plan breve (pasos).

Cambios en forma de parches.

Validación mínima:

npm run build && npm run preview


Si hay tests, ejecutarlos.

Resultado: resumen, supuestos, próximos pasos.

7) Convenciones del repositorio
7.1 Secciones y anclas

Cada sección usa id = <categoria> y el DOM id resultante es section-<id>.

Regla: targetId de la categoría siempre = "section-" + id".

Ids actuales (no cambiar):
desayunos, bowls, platos, sandwiches, smoothies, cafe, bebidasfrias, postres.

7.2 Imágenes de producto

Convención sin mapeos manuales:

Si product.id: /public/img/products/<id>.jpg

Si no, slug de name: /public/img/products/<slug>.jpg

Fallback: /public/img/products/placeholder.jpg

onError en <img> o AAImage: setear src = placeholder una sola vez (marcar con dataset.fallback).

7.3 ProductSection (mostrar secciones y evitar duplicados)

Props esperadas:

alwaysShow (bool, default false): si true, no retornar null aunque el conteo filtrado sea 0 (mostrar Empty State).

includeUnavailable (bool, default true): incluye ítems available: false (se renderizan en gris).

Subtítulos duplicados: si un grupo tiene title igual (ignorando acentos/mayúsculas) al title de la sección, no renderizar ese <h3>.

7.4 ColdDrinksSection (robustez)

Detectar arrays existentes desde menuItems (p. ej., sodas, otherDrinks, lemonades, etc.).

Pasar a ProductSection con: id="bebidasfrias", title="Bebidas frías", alwaysShow={true}, includeUnavailable={true}.

Reportar onCount(total) sin filtrar por query/available.

8) Checklist de QA rápido (siempre)

Tabs navegan a su sección (anclas correctas).

Sin títulos duplicados (especial “Sándwiches” y “Bebidas frías”).

QuickView abre/cierra y el body no queda bloqueado.

Imágenes reales cargan; si faltan, se ve placeholder.

Build: npm run build sin errores.

9) Mensajes de commit (cuando el usuario lo pida)

Conventional Commits:
feat: …, fix: …, chore: …, refactor: …, docs: …, style: …, test: …, build: ….

10) Estilo de comunicación del agente

Español claro, directo y amable.

Entregar: Plan → Parche → Validación → Resultado.

No pedir confirmaciones innecesarias; si es seguro, procede.

Dividir tareas grandes en subtareas y resolver una por vez.

11) Seguridad y límites

No ejecutar comandos con acceso a red salvo aprobación.

No escribir fuera del workspace.

No exponer secretos ni rutas sensibles.

Tareas iniciales sugeridas (ejecutar una por una)

Verificar anclas de categorías (targetId = section-<id>).

Evitar subtítulos duplicados en ProductSection.

Asegurar ColdDrinksSection con alwaysShow/includeUnavailable.

Revisar imágenes y placeholder; aplicar onError universal.

Validación final: npm run build && npm run preview y smoke test de navegación/QuickView/imagenes.