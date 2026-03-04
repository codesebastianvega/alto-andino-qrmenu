# IDEAS Y ROADMAP — ALTO ANDINO QR MENU

---

## 📌 Cómo usar este archivo

```
# Título grande (sección principal)
## Subtítulo (tema dentro de sección)
### Sub-subtítulo (detalle)

*texto en cursiva* → ideas tentativas, no prioritarias
**texto en negrita** → MUY importante, prioritario
`código` → nombres de componentes, archivos, términos técnicos

- Lista normal
  - sub-item

[ ] Tarea pendiente
[x] Tarea completada
[/] En progreso

> Nota o pregunta para revisar con equipo

---  ← separador de secciones
```

**Tip de emojis:**
- 🔴 Urgente / bug
- 🟡 Importante pero no urgente
- 🟢 Nice-to-have / mejora
- 💡 Idea nueva a explorar
- ❓ Pregunta / duda

---

## 🏠 IDENTIDAD DEL LOCAL (contexto para diseño)

- **Paleta real:** negro, beige, blanco, tonos madera — el verde es de las plantas, no del branding
- **Ambiente:** cálido como cabaña + aires de café premium bogotano
- **Planta mascota del local:** Cocoa, pitbull bonsái, muy tierna 🐶
- **Propuesta de valor:** Comer rico Y sano — pokes, desayunos proteicos, bowls
- **Cliente típico:** médicos, enfermeros del hospital cercano, personas del gym, health-conscious
- **Atributos extra:** pet-friendly ✅, WiFi ✅, muchas plantas, mobiliario artesanal (sillas tejidas negras, mesas madera)
- **Fotos:** el dueño tiene fotos profesionales del local ✅
- **Google Business:** existe tarjeta, sin reseñas aún → vamos a construir el sistema de reseñas

> 💡 El verde `#2f4131` actual viene de las plantas. Podríamos migrar el brandingcolor principal a un negro suave o beige oscuro y usar el verde solo como acento natural.

---

## 🏗️ LANDING PAGE

### Prompt para prototipos (usar en Stitch / Figma / v0)

```
Design a premium restaurant landing page for "Alto Andino", a healthy food café 
in Colombia. The brand identity uses black, beige, white and warm wood tones — 
green appears only as a natural accent (plants). The atmosphere is warm like a 
mountain cabin meets premium Bogotá café. Lots of plants, handmade woven black 
chairs, wood tables.

Target audience: health-conscious professionals (doctors, gym-goers, hospital workers).
Core offering: healthy and delicious food — poke bowls, protein breakfasts, fresh bowls.
Differentiators: pet-friendly (the café dog is Cocoa, a bonsai pitbull), WiFi, 
plant-filled space, locally crafted furniture.

The page should feel premium, warm and natural — NOT sterile health-food. 
Think: Forest bathing meets specialty coffee aesthetics.

Sections needed:
1. Hero — full-bleed photo/video background, "Comer rico y sano" headline, 
   two CTAs: "Ver Menú" (primary) + "Reservar" (secondary ghost button)
2. Value props strip — 3-4 icons: Pet Friendly · WiFi · Healthy Food · Ambiente único
3. Featured dishes — 3 cards with dish photo, name, price badge
4. Experiences teaser — catas, talleres, eventos únicos (dark earthy section)
5. Reviews — 3 customer cards (placeholder for now)
6. Location + hours — warm map embed + schedule
7. Footer — social links, WhatsApp CTA

Design constraints:
- Mobile-first PWA shell — bottom nav tabs on mobile
- Typography: elegant serif for headlines (e.g. Playfair Display), sans for body
- Colors: #1A1A1A (black), #F5EFE6 (warm beige), #FFFFFF, wood accent #8B6914
- Micro-animations: parallax hero, fade-in on scroll for sections
- NO cold blues, NO flat minimalism — must feel alive and inviting
```

### Secciones confirmadas
- [ ] Hero con foto real + CTA "Ver Menú" / "Reservar"
- [ ] Strip de atributos (Pet Friendly, WiFi, Saludable, Único)
- [ ] Platos destacados (cards con foto)
- [ ] Teaser de Experiencias
- [ ] Reseñas *(sistema a construir, por ahora placeholders)*
- [ ] Mapa + horarios
- [ ] Footer con redes y WhatsApp

---

## 📱 NAVBAR — ESTRUCTURA FINAL

### Mobile (app nativa — bottom tabs)
```
[🏠 Inicio] [🍽️ Menú] [✨ Experiencias] [👤 Perfil]
```
- Tab activo: highlight con punto o underline suave
- **El carrito NO es un tab** → es una **píldora FAB flotante** (glassmorphism)  
  `[ 🛒 3 items · $45.000 ]` — aparece solo cuando hay items, posición bottom-center  
  sobre la navbar, con efecto glass + sombra suave

### Desktop (navbar horizontal top)
- Logo izquierda
- Links centro: Inicio · Menú · Experiencias
- Derecha: botón Perfil (avatar/icono) + carrito pill

### Tab "Perfil" — contenido (pantalla tipo Linktree)
- [ ] Mis Pedidos
- [ ] 🔐 Panel Admin *(solo visible si es admin — lógica ya existe en el contexto)*
- [ ] Ser Aliados / B2B
- [ ] Redes de Alto Andino
- [ ] Reseñas (Google o form interno)

---

## 🔗 PANTALLA TIPO LINKTREE / MODO DE SERVICIO

**Objetivo:** que el usuario elija su flujo antes de pedir

Cards grandes con ícono ilustrativo:
- 🍽️ **Comer aquí** → flujo normal QR en mesa
- 🛍️ **Para llevar** → elige horario de recogida
- 🚚 **Domicilio** → ingresa dirección → cotiza → pide

> Diferente al flujo actual — más onboarding, más guiado, muy visual  
> Podría ser la pantalla de bienvenida cuando se abre la app por primera vez

---

## �️ PANTALLAS TÁCTILES EN DESKTOP

**Solución (no es un cambio gigante — auditoría de componentes):**

- [x] Botones ya en mínimo 44x44px ✅
- [ ] Agregar `touch-action: manipulation` globalmente en `index.css` (elimina delay 300ms)
- [ ] Auditar que ningún elemento use `hover:` como ÚNICA forma de revelar UI
- [ ] Asegurar que hover AND active/pressed styles coexistan (mouse = gran experiencia, touch = igual de buena)
- [x] Swipe horizontal en categorías ya funciona ✅

> La idea es: hover para mouse (gran experiencia), active/touch para táctil — los dos al mismo tiempo, no uno o el otro.

---

## ✨ MEJORAS PREMIUM (complementan la landing)

- [ ] **Hero animado** con parallax suave (fondo se mueve al scroll)
- [ ] **Transición entre páginas** Landing ↔ Menú (fade o slide suave)
- [ ] **Tipografía premium** — serif para títulos (Playfair Display o similar), liga mejor con la identidad cálida
- [ ] **Dark mode auto** según preferencia del sistema operativo
- [ ] **Paleta de colores migrada** del verde `#2f4131` actual → negro/beige del local real
- [ ] **Compartir plato** — botón para enviar link de producto por WhatsApp
- [ ] **Estimado de tiempo de preparación** visible en carrito
- [ ] **Búsqueda inteligente** con filtros de dieta desde landing (vegano, sin gluten, proteico)
- [ ] **Modo quiosco** — para tablet fija en el local, sin navbar, fullscreen
- [ ] **Gamificación simple** — "Has pedido 5 veces → 10% off" (loyalty básico)
- [ ] **Personalización por horario** — desayunos solo visibles antes de las 11am

---

## 🧠 SISTEMA / BACKEND IDEAS

- [ ] Comandas para impresión (punto de venta físico)
- [ ] Medios de pago para referencia en pedidos
- [ ] `requires_kitchen` toggle ya existe por producto ✅
- [ ] Envío a cocina automático cuando admin/mesero toma pedido
- [ ] Flujo de reserva de mesa desde la app
- [ ] escnaeo de codigo de barras para productos (quizas mas adelante integar un generador de codigos de barras o etiquetas para impresora de stikers) para pordutos que nosotros hacemosy sea mas facil de buscar en el pos
- [ ] ir revidsando un mini pos para alto andino y no depender del otro sistema que tenemos para emepzar a llevar la contabilidad nuestra mas centralizada

---

## ✅ COMPLETADO

[x] Rediseño de cards de producto (nativo app, rounded, shadow suave)
[x] Floating cart bar (reemplazó tabs inferiores)
[x] Banner de experiencias al inicio del menú
[x] Eliminación del carousel de experiencias del menú
[x] Iconos del carrito alineados (`CartModal.jsx`)
[x] Campos `type="url"` → `type="text"` en formularios admin
[x] Layout desktop bento con hero card `col-span-2`
[x] Contenedor más ancho en desktop (`max-w-5xl / max-w-6xl`)
[x] Placeholder "Sin foto" en cards sin imagen
