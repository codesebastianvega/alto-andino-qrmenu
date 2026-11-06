# 📜 Reglas Maestras de Producción Audiovisual Aluna (`video_rules.md`)

> **DIRECTIVA MANDATORIA:** Este archivo contiene las reglas estrictas de consistencia que DEBEN leerse y aplicarse antes de generar, editar o renderizar cualquier video promocional, reel o contenido cinemático de Aluna.

---

## 1. La Música es el Reloj (Beat Grid Obligatorio)

1. **Cero cortes al azar:** Ningún cambio de escena, golpe visual o aparición de texto ocurre en segundos decimales inventados. Todo corte cae **exactamente sobre un golpe musical (downbeat, kick, snare o drop)**.
2. **Uso de detección de ritmo:**
   * Al agregar una pista musical (`assets/audio/track.mp3`), se debe correr:
     ```bash
     hyperframes beats assets/audio/track.mp3
     ```
   * O calcular matemáticamente los frames por beat:
     $$\text{Frames por Beat} = \frac{\text{FPS} \times 60}{\text{BPM}}$$
   * Los cortes de escena se anclan en los compases (bars) y los acentos visuales en los beats.

---

## 2. Erradicación del "Look IA" (Filtro Anti-Sintético)

Para que el video no parezca una plantilla de IA barata:
1. **Nunca 100% interfaz estática:** Intercalar o fondear con **clips reales de video B-Roll** (manos humanas sosteniendo el plato, fuego en el wok, vapor de carne, textura de alimentos reales).
2. **Sonido foley orgánico:**
   * Prohibido usar "dings" o campanitas sintetizadas de dibujos animados.
   * Usar foley táctil real: clics hápticos tipo iPhone, chasquidos metálicos suaves, sonido de sizzle de cocina, bajos profundos analógicos.
   * La luz viaja más rápido que el sonido: el impacto de audio debe sincronizarse **exactamente 1 frame después** del contacto visual en pantalla.
3. **Tipografía con jerarquía severa:**
   * No más de 2 familias tipográficas en pantalla.
   * `DM Serif Display` para la emoción y el concepto gastronómico.
   * `Plus Jakarta Sans` u `Outfit` para datos duros y números de negocio.

---

## 3. Estructura de Guión para B2B Gastronómico (30-45 Segundos)

Toda pieza para restaurantes debe responder a esta progresión psicológica:
* **00:00 - 00:03 | El Gancho del Dolor (Pattern Interrupt):** Tocar una herida real del dueño (ej: cartas en PDF pesadas, 25% de comisiones de Rappi, colapso de meseros).
* **00:03 - 00:10 | La Revelación Tecnológica (The Wow Factor):** Mostrar la velocidad de 0.8s de Aluna y la belleza del producto en un mockup 3D de alta gama.
* **00:10 - 00:20 | Demostración Operativa (Cocina & Mesa):** El comensal ordenando y la comanda entrando en tiempo real a la pantalla KDS de cocina.
* **00:20 - 00:28 | El Dinero en Caja (Proof of Profit):** Números claros: +$14.700 COP por mesa, 0% comisión, 100% ganancia directa.
* **00:28 - 00:35 | El Call to Action Irresistible:** Oferta de 7 días gratis sin tarjeta + link en bio.

---

## 4. Estándares Técnicos de Código (HyperFrames / GSAP)

1. **Resolución:** Vertical 9:16 (1080 × 1920 px) @ 30 o 60 FPS.
2. **Zero Transform Conflicts:** Nunca definir `transform: translateY(...)` en CSS si ese elemento va a ser animado en `y` con GSAP. Definir siempre las posiciones iniciales mediante `gsap.set()`.
3. **Baseline Seguro en `fromTo`:** Si se reutiliza un elemento (como el cursor o un destello) en múltiples `fromTo`, agregar siempre `immediateRender: false` a partir del segundo llamado para evitar sobreescritura del estado de reposo.
4. **Niveles de Audio:** 
   * Pista de música de fondo atenuada (`data-volume="0.18"` a `0.24"`).
   * Efectos de impacto y clics a nivel óptimo (`0.9"` a `1.0"`).
   * El master no debe superar los `-1 dBTP` para evitar distorsión en altavoces de teléfonos móviles.
