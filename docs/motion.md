# 🌌 Aluna Motion Design System (`motion.md`)

Este documento define la **gramática de movimiento, estilo visual y ritmo cinematográfico** oficial para todas las producciones audiovisuales de Aluna. Su objetivo es erradicar el "look generado por IA" (animaciones flotantes, rebotes baratos, vectores planos) y elevar las piezas a un estándar **editorial, de lujo y high-tech (estilo Apple / Stripe / A24)**.

---

## 1. Identidad Visual & Look de Marca (The LOOK)

| Token | Valor / Especificación | Rol en Video |
| :--- | :--- | :--- |
| **`--ground`** | `#070A08` a `#020403` (Radial con centro `#132219`) | Fondo de lujo oscuro. Nunca degradados lineales simples (provocan banding en compresión). |
| **`--gold-accent`** | `#D4A853` (Highlights: `#F3D28E`, Sombras: `#99752D`) | Acento de valor, llamados a la acción, badges de rentabilidad y destellos. |
| **`--emerald`** | `#2D6A4F` (Bisel activo: `#1B4332`, Glow: `rgba(45,106,79,0.3)`) | Señal operativa, KDS cocina, confirmaciones de éxito y estado en vivo. |
| **`--ink-primary`**| `#FFFFFF` (100% nitidez) | Titulares principales y lectura crítica. |
| **`--ink-secondary`**| `#94A3B8` / `#A3B899` | Subtítulos y datos técnicos. |
| **`--font-display`**| `'DM Serif Display', serif` | Titulares de autor, sofisticación gastronómica. |
| **`--font-ui`** | `'Plus Jakarta Sans', sans-serif` | Interfaces, precios, botones y métricas. |
| **`--font-badges`** | `'Outfit', sans-serif` (Weight: 800/900) | Pills flotantes, contadores numéricos y llamados a la acción. |

---

## 2. Física del Movimiento (Easing & Curvas)

### 🚫 Lo que está PROHIBIDO (The "AI Look"):
* **Prohibido:** `power2.out` por defecto a 0.5s en todo (se siente plano y predecible).
* **Prohibido:** Rebotes exagerados de caricatura en UI (`back.out(3)` o `bounce.out`).
* **Prohibido:** Clics con círculos expansivos tipo plantilla web infantil.
* **Prohibido:** Efectos de "respiración" o escala lenta infinita una vez que un elemento ya aterrizó.
* **Prohibido:** Que todos los textos entren deslizándose de abajo hacia arriba con fade.

### ✅ Las Curvas Oficiales de Aluna:
1. **Aterrizajes de Lujo (Arrivals):**
   * Curva: `expo.out` o `power4.out`.
   * Pacing: El elemento viaja rápido y desacelera con una cola larga y elegante. Llega y **se queda completamente inmóvil**.
2. **Salidas (Exits):**
   * Curva: `power3.in` o `power2.in`.
   * Duración: 40% a 50% más rápidas que las entradas. Salen sin titubear.
3. **Cámara y Rotación 3D de Dispositivos:**
   * Curva: `power2.inOut` o `power3.inOut`.
   * Un dispositivo 3D nunca se mueve de forma errática: tiene inercia de objeto pesado y pulido.
4. **Stagger (Desfase entre elementos):**
   * Letras: 1 frame (~33ms) de diferencia.
   * Palabras: 60ms a 100ms.
   * Filas o items de lista: 40ms a 80ms con caída en cascada.

---

## 3. Composición en Capas: El Secreto Anti-IA

Un video se ve falso cuando **todo es vector y CSS plano**. Para verse con producción de nivel global, toda escena debe construirse en **3 planos de profundidad**:

```
[ PLANO 3 (FONDO) ]:  Video B-Roll Real 4K (fuego, chef cortando, vapor de corte) o 
                       atmósfera oscura con orbes y partículas de luz.
                             ▲
[ PLANO 2 (HERO)  ]:  Mockup 3D realista con hardware, biseles metálicos, 
                       reflejos de pantalla y la interfaz real en alta resolución.
                             ▲
[ PLANO 1 (FRENTE)]:  Tipografía cinética impecable, badges flotantes de métricas 
                       y destellos de luz dorada.
```

---

## 4. Tipos de Transiciones Permitidas

Nunca usar más de 3 o 4 tipos en un mismo video:
1. **Match Cut en Aceleración:** Se corta en el punto de máxima velocidad de un movimiento de cámara o swipe.
2. **Zoom-Through:** La cámara se sumerge a través de un botón o de la pantalla del celular hacia el siguiente escenario.
3. **Whip Pan (Barrido con Motion Blur):** Transición lateral rápida de 0.15s - 0.25s con desenfoque de movimiento.
4. **Dip Cut Oscuro:** La pantalla se atenúa 3 frames antes del corte duro para que el ojo asimile el cambio de escena.

---

## 5. Tiempos de Retención y Lectura (The Reading Floor)

* **Fórmula de retención de texto:**  
  $$\text{Tiempo de permanencia} = 0.5\text{ s} + (0.3\text{ s} \times \text{número de palabras})$$
* Un titular de 5 palabras debe mantenerse legible en pantalla al menos **2.0 segundos** antes de desaparecer o cambiar.
* El Call to Action final debe sostenerse **mínimo 2.5 a 3.0 segundos**.
