
import { useState, useMemo, useEffect, useRef } from "react";
import { formatCOP } from "@/utils/money";
import { useCart } from "@/context/CartContext";
import Portal from "./Portal";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
 
 // Tile ancho completo con estados
 function Tile({ active, disabled, onClick, children }) {
   return (
     <button
       type="button"
       onClick={onClick}
       disabled={disabled && !active}
       aria-pressed={active}
       className={
        "w-full rounded-xl px-3 py-2 text-left text-sm ring-1 transition " +
         (active
          ? "bg-[#2f4131] text-white shadow-sm ring-[#2f4131]"
           : "bg-white text-neutral-900 ring-neutral-200 hover:ring-neutral-300") +
        (disabled && !active ? " cursor-not-allowed opacity-50" : "")
       }
     >
       {children}
     </button>
   );
 }
 
// Emojis por ingrediente (prefijo)
function ico(label) {
  const s = label.toLowerCase();
  if (s.includes("arroz")) return "🍚";
  if (s.includes("quinoa")) return "🌾";
  if (s.includes("lechuga") || s.includes("mix")) return "🥬";

  if (s.includes("pollo")) return "🍗";
  if (s.includes("res")) return "🥩";
  if (s.includes("tofu")) return "🌿";
  if (s.includes("atún")) return "🐟";
  if (s.includes("salmón")) return "🐟";
  if (s.includes("camarón")) return "🍤";

  if (s.includes("aguacate")) return "🥑";
  if (s.includes("mango")) return "🥭";
  if (s.includes("pepino")) return "🥒";
  if (s.includes("maíz")) return "🌽";
  if (s.includes("tomate")) return "🍅";
  if (s.includes("brócoli")) return "🥦";
  if (s.includes("champi")) return "🍄";
  if (s.includes("hummus")) return "🌿";
  if (s.includes("rábano")) return "🥗";
  if (s.includes("zanahoria")) return "🥕";
  if (s.includes("pimentón")) return "🫑";
  if (s.includes("arándano")) return "🫐";
  if (s.includes("kiwi")) return "🥝";

  if (s.includes("chía")) return "🌱";
  if (s.includes("linaza")) return "🌾";
  if (s.includes("almendra")) return "🥜";
  if (s.includes("jengibre")) return "🫚";
  if (s.includes("pepinillo")) return "🥒";
  if (s.includes("aceituna")) return "🫒";
  if (s.includes("aceite")) return "🫗";
  if (s.includes("ajonjolí")) return "🌾";
  if (s.includes("jalape")) return "🌶️";
  if (s.includes("alga")) return "🌿";
  if (s.includes("guacamole")) return "🥑";

  if (s.includes("hotsweet")) return "🌶️";
  if (s.includes("mango-yaki")) return "🥭";
  if (s.includes("balsámico")) return "🧴";
  if (s.includes("yogur")) return "🥛";
  if (s.includes("soja") || s.includes("soya")) return "🍶";
  if (s.includes("mayo-pesto")) return "🌿";
  return "•";
}

const BASE = 28000;
const PREMIUM = 4000;
const bases = ["Arroz blanco", "Quinoa", "Mix de lechugas"];
const proteins = [
  { name: "Pollo" },
  { name: "Res" },
  { name: "Tofu" },
  { name: "Atún" },
  { name: "Salmón", premium: true },
  { name: "Camarón", premium: true },
];
const toppings = [
  "Aguacate",
  "Mango",
  "Pepino",
  "Maíz",
  "Tomate cherry",
  "Brócoli",
  "Champiñones",
  "Hummus",
  "Rábano",
  "Zanahoria",
  "Pimentón",
  "Arándano",
  "Kiwi",
];
const extras = [
  "Chía",
  "Linaza",
  "Láminas de almendra",
  "Jengibre encurtido",
  "Pepinillos",
  "Aceitunas",
  "Aceite de oliva",
  "Ajonjolí",
  "Jalapeños",
  "Alga nori",
];
// 🔁 Salsas unificadas (¡ojo! “HotSweet de la Casa” en una sola opción)
const sauces = [
  "HotSweet de la Casa",
  "Mango-yaki",
  "Balsámico",
  "Yogur",
  "Soja",
  "Mayo-pesto",
  "Sin Salsa",
];

const MAX_TOPS = 4;
const MAX_EXTS = 3;
 
 export default function BowlBuilder({ open, onClose }) {
   useLockBodyScroll(open);
   const cart = useCart();
   const modalRef = useRef(null);
   const lastFocused = useRef(null);
 
   useEffect(() => {
     if (!open) return;
     lastFocused.current = document.activeElement;
     const el = modalRef.current;
     el?.focus();
     const onKey = (e) => {
       if (e.key === "Escape") onClose?.();
       if (e.key === "Tab") {
         const focusables = el.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
         );
         if (!focusables.length) return;
         const first = focusables[0];
         const last = focusables[focusables.length - 1];
         if (e.shiftKey && document.activeElement === first) {
           e.preventDefault();
           last.focus();
         } else if (!e.shiftKey && document.activeElement === last) {
           e.preventDefault();
           first.focus();
         }
       }
     };
     document.addEventListener("keydown", onKey);
     return () => {
       document.removeEventListener("keydown", onKey);
       lastFocused.current?.focus?.();
     };
   }, [open, onClose]);
 
   if (!open) return null;
 
  // Estado
  const [base, setBase] = useState(bases[0]);
  const [protein, setProtein] = useState("Pollo");
  const [tops, setTops] = useState([]);
  const [exts, setExts] = useState([]);
  const [sauce, setSauce] = useState("Sin Salsa");
  const [note, setNote] = useState("");
 
  const isPremium = useMemo(() => ["Salmón", "Camarón"].includes(protein), [protein]);
   const price = useMemo(() => BASE + (isPremium ? PREMIUM : 0), [isPremium]);
 
   const toggleLimited = (list, setList, max, item) => {
     setList((prev) => {
       const has = prev.includes(item);
       if (has) return prev.filter((x) => x !== item);
       if (prev.length >= max) return prev;
       return [...prev, item];
     });
   };
 
   const resetAll = () => {
     setBase(bases[0]);
     setProtein("Pollo");
     setTops([]);
     setExts([]);
     setSauce("Sin Salsa");
     setNote("");
   };
 
   const addToCart = () => {
     cart.addItem({
       productId: "bowl-personalizado",
       name: "Bowl personalizado",
       price,
       options: {
         Base: base,
         Proteína: protein,
         Toppings: tops,
         Extras: exts,
         Salsa: sauce,
       },
       note,
     });
     setNote("");
     onClose();
   };
 
  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100]">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onClose?.()}
        />
 
        <div
          ref={modalRef}
          tabIndex={-1}
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-[110] mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#FAF7F2] shadow-2xl focus-visible:outline-none"
        >
          {/* Header */}
          <div className="rounded-t-2xl bg-[#2f4131] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Arma tu bowl</h3>
                <p className="text-xs text-white/90">
                  1 base, 1 proteína, 4 toppings, 3 extras y 1 salsa.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-8 rounded-full bg-white px-3 text-sm text-[#2f4131] hover:bg-white/90"
                  onClick={resetAll}
                >
                  Restablecer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-white/95 underline underline-offset-2"
                >
                  Cerrar
                </button>
              </div>
             </div>
           </div>

          {/* Body scrollable */}
          <div className="space-y-3 overflow-y-auto px-4 pb-4 sm:space-y-4">
            {/* Resumen */}
            <div className="rounded-lg bg-white px-3 py-2 text-sm text-neutral-800 ring-1 ring-neutral-200">
              Base: {base} · Prot: {protein} {isPremium && "(+ $4.000)"} · Top: {tops.length}/
              {MAX_TOPS} · Extras: {exts.length}/{MAX_EXTS} · Salsa: {sauce} · Total:{" "}
              {formatCOP(price)}
             </div>

            {/* Base */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">1) Base</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {bases.map((b) => (
                  <Tile key={b} active={b === base} onClick={() => setBase(b)}>
                    {ico(b)}&nbsp;{b}
                  </Tile>
                ))}
              </div>
            </section>
 

            {/* Proteína */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">2) Proteína</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {proteins.map((p) => (
                  <Tile key={p.name} active={p.name === protein} onClick={() => setProtein(p.name)}>
                    {ico(p.name)}&nbsp;{p.name}
                    {p.premium ? " · (+$4.000)" : ""}
                  </Tile>
                ))}
              </div>
            </section>
 
            {/* Toppings */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2f4131]">3) Toppings</p>
                <p className="text-xs text-neutral-600">
                  Seleccionados: {tops.length}/{MAX_TOPS}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {toppings.map((t) => (
                  <Tile
                    key={t}
                    active={tops.includes(t)}
                    disabled={tops.length >= MAX_TOPS}
                    onClick={() => toggleLimited(tops, setTops, MAX_TOPS, t)}
                  >
                    {ico(t)}&nbsp;{t}
                  </Tile>
               ))}
              </div>
            </section>
 
            {/* Extras */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2f4131]">4) Extras</p>
                <p className="text-xs text-neutral-600">
                  Seleccionados: {exts.length}/{MAX_EXTS}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {extras.map((e) => (
                  <Tile
                    key={e}
                    active={exts.includes(e)}
                    disabled={exts.length >= MAX_EXTS}
                    onClick={() => toggleLimited(exts, setExts, MAX_EXTS, e)}
                  >
                    {ico(e)}&nbsp;{e}
                  </Tile>
                ))}
              </div>
            </section>
 
            {/* Salsa */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">5) Salsa</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {sauces.map((s) => (
                  <Tile key={s} active={s === sauce} onClick={() => setSauce(s)}>
                    {ico(s)}&nbsp;{s}
                 </Tile>
                ))}
              </div>
            </section>

            {/* Nota y acciones */}
            <div>
              <label className="block text-xs text-neutral-600">Nota para cocina (opcional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej.: sin sal, extra salsa, poco picante..."
                maxLength={120}
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 pb-[env(safe-area-inset-bottom)] pt-2">
               <button
                 type="button"
                 onClick={onClose}
                className="h-9 flex-1 rounded-lg bg-white/10 text-sm text-white ring-1 ring-white/15 hover:bg-white/15"
               >
                 Seguir pidiendo
               </button>
               <button
                 type="button"
                 onClick={addToCart}
                className="h-9 flex-1 rounded-lg bg-[#2f4131] text-sm text-white hover:bg-[#243326]"
               >
                 Añadir al carrito
               </button>
             </div>
           </div>
         </div>
       </div>
     </Portal>
   );
 }
