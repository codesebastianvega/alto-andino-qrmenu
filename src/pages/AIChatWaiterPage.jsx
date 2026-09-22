import React, { useState, useRef, useEffect, useMemo } from "react";
import { useMenuData } from "@/context/MenuDataContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/config/supabase";
import { formatCOP } from "@/utils/money";
import { cleanAssistantName } from "@/utils/formatters";
import { toast } from "@/components/Toast";
import AIAvatar from "@/components/ui/AIAvatar";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";
import { motion, AnimatePresence } from "framer-motion";
import ProductQuickView from "@/components/ProductQuickView";
import DIYProductModal from "@/components/DIYProductModal";

export default function AIChatWaiterPage() {
  const { 
    brand,
    activeBrandId,
    brandName, 
    homeSettings, 
    restaurantSettings, 
    currentLocation, 
    getAllProducts,
    categories = []
  } = useMenuData();

  const { items = [], total = 0, addItem } = useCart() || {};

  const assistantName = cleanAssistantName(homeSettings?.concierge_h1, "Boki");
  const assistantAvatar = homeSettings?.concierge_img || "boki_bento";

  const allProducts = useMemo(() => {
    return typeof getAllProducts === 'function' ? getAllProducts() : [];
  }, [getAllProducts]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDiyProduct, setSelectedDiyProduct] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dynamic smart chips generated from actual menu categories and active products
  const dynamicWelcomeChips = useMemo(() => {
    const chips = [];

    // 1. Categories from the active brand
    if (categories && categories.length > 0) {
      const activeCats = categories.filter(c => c.name && c.is_active !== false);
      if (activeCats.length > 0) {
        chips.push(`🍱 Ver ${activeCats[0].name}`);
        if (activeCats.length > 1) {
          chips.push(`✨ ${activeCats[1].name}`);
        }
      }
    }

    // 2. Real products / popular dishes from this restaurant
    if (allProducts && allProducts.length > 0) {
      const popular = allProducts.find(p => p.is_featured || p.tags?.some(t => /popular|destacado|estrella/i.test(t))) || allProducts[0];
      if (popular?.name && chips.length < 3) {
        chips.push(`⭐ Recomiéndame ${popular.name}`);
      }

      const hasHealthy = allProducts.some(p => p.tags?.some(t => /fresco|ligero|ensalada|bowl|saludable/i.test(t)) || /fresco|saludable|ligero/i.test(p.description || ''));
      if (hasHealthy && chips.length < 4) {
        chips.push(`🥑 Algo fresco y ligero`);
      }
    }

    if (chips.length === 0) {
      chips.push("⭐ Platos más pedidos", "🥑 Algo fresco y ligero", "🛵 Armar mi pedido");
    }

    return chips.slice(0, 4);
  }, [categories, allProducts]);

  // Initial welcome message
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      sender: "ai",
      text: `¡Hola! 👋 Soy ${assistantName}.\n\n¿Qué se te antoja hoy? Puedo recomendarte las mejores opciones de nuestra carta, combinaciones deliciosas o armarte el pedido ideal.`,
      timestamp: new Date()
    }
  ]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const openCartModal = () => {
    window.dispatchEvent(new CustomEvent("aa:open-cart"));
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery("");

    // Add user message
    const userMsgId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text: query,
        timestamp: new Date()
      }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const targetBrandId = brand?.id || activeBrandId;
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validLocationId = currentLocation?.id && UUID_REGEX.test(currentLocation.id) ? currentLocation.id : null;

      // Cart context to help AI recommend complements instead of duplicates
      const currentCartIds = new Set(items.map(i => i.productId || i.id));
      const cartItemNames = items.map(i => i.name).filter(Boolean);
      const cartContextPrompt = cartItemNames.length > 0
        ? `\n\n[Contexto del cliente: Ya tiene en su pedido: ${cartItemNames.join(", ")}. Recomiéndale opciones complementarias o sugerencias diferentes, sin repetir los mismos platos].`
        : "";

      const configuredPrompt = homeSettings?.concierge_prompt_template?.trim();
      const prompt = configuredPrompt
        ? `${configuredPrompt}\n\nPregunta del cliente: ${query}${cartContextPrompt}`
        : `${query}${cartContextPrompt}`;

      // Protect user against edge function hanging or latency > 12s
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 12000);
      });

      const invokePromise = supabase.functions.invoke("gemini-chat", {
        body: {
          prompt,
          brand_id: targetBrandId,
          location_id: validLocationId,
          mode: "concierge",
          model: "gemini-3.5-flash-lite"
        }
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) throw error;

      // Match products returned with full DB product details
      let matchedProducts = [];
      if (Array.isArray(data?.product_ids) && data.product_ids.length > 0) {
        matchedProducts = data.product_ids
          .map(id => allProducts.find(p => p.id === id))
          .filter(Boolean);
      } else if (Array.isArray(data?.products) && data.products.length > 0) {
        matchedProducts = data.products
          .map(p => allProducts.find(dbP => dbP.id === p.id) || p)
          .filter(Boolean);
      }

      // Filter out products already present in cart if possible
      const filteredRecommendations = matchedProducts.filter(p => !currentCartIds.has(p.id));
      const finalProducts = filteredRecommendations.length > 0 ? filteredRecommendations : matchedProducts;

      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: data?.reply || "¡Aquí tienes algunas recomendaciones de nuestra carta que te encantarán!",
          products: finalProducts,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.warn("Respuesta local inteligente tras demora o error de IA:", err?.message || err);

      // Smart semantic matching using local catalog so the user is never left hanging
      const currentCartIds = new Set(items.map(i => i.productId || i.id));
      const qLower = query.toLowerCase();
      const words = qLower.split(/\s+/).filter(w => w.length > 2);

      const matched = allProducts.filter(p => {
        if (currentCartIds.has(p.id)) return false;
        const text = `${p.name} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return words.some(w => text.includes(w));
      });

      const availableFallback = allProducts.filter(p => !currentCartIds.has(p.id));
      const fallbackProducts = (matched.length > 0 ? matched : (availableFallback.length > 0 ? availableFallback : allProducts)).slice(0, 3);

      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: matched.length > 0
            ? `¡Encontré estas opciones en nuestra carta que se ajustan a lo que buscas! Toca cualquiera para ver sus ingredientes y detalles:`
            : `Aquí tienes algunas de nuestras recomendaciones favoritas disponibles hoy en la carta. Toca cualquiera para ver sus detalles:`,
          products: fallbackProducts,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!product || !addItem) return;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.image_url,
      image_url: product.image_url || product.image,
      packaging_fee: product.packaging_fee || 0,
      qty: 1,
      options: {}
    });

    setAddedItemIds(prev => new Set(prev).add(product.id));
    toast.success(`${product.name} agregado al pedido`);

    setTimeout(() => {
      setAddedItemIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const handleOpenProductDetail = (prod) => {
    if (!prod) return;
    const fullProd = allProducts.find(p => p.id === prod.id) || prod;
    const desc = fullProd.description || fullProd.desc || fullProd.subtitle || "";
    const enriched = {
      ...fullProd,
      title: fullProd.title || fullProd.name || "",
      subtitle: desc,
      description: desc,
    };
    if (enriched.is_diy || enriched.is_build_your_own) {
      setSelectedDiyProduct(enriched);
    } else {
      setSelectedProduct(enriched);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-[100dvh] bg-[#0c0d10] text-neutral-100 font-sans selection:bg-emerald-500/20 overflow-hidden"
    >
      {/* Ambient background glow for high-tech AI atmosphere */}
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
      
      {/* 1. MINIMAL HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="flex-shrink-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#0e1014]/90 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { window.location.hash = "#menu"; }}
            className="p-1.5 -ml-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95"
            aria-label="Volver a la carta"
          >
            <Icon icon="heroicons:chevron-left" className="text-2xl" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <AIAvatar avatar={assistantAvatar} className="w-8 h-8 rounded-full ring-1 ring-white/10" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0e1014]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold text-neutral-100 leading-tight tracking-tight">{assistantName}</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">IA</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-normal leading-tight">
                {brandName || 'Mesero digital'}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Cart Pill in Header */}
        <button
          type="button"
          onClick={openCartModal}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-medium text-neutral-200 transition-all active:scale-95"
        >
          <Icon icon="heroicons:shopping-bag" className="text-sm text-emerald-400" />
          <span>Pedido</span>
          {items.length > 0 && (
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-emerald-600 rounded-full">
              {items.length}
            </span>
          )}
        </button>
      </motion.header>

      {/* 2. CHAT STREAM */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-2.5 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <AIAvatar avatar={assistantAvatar} className="w-7 h-7 shrink-0 mt-0.5 rounded-full ring-1 ring-white/10" />
              )}

              <div className="space-y-2.5 max-w-[88%] sm:max-w-[80%]">
                {/* Text Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-emerald-600/90 text-white rounded-tr-sm shadow-sm"
                      : "bg-white/[0.04] border border-white/[0.06] text-neutral-200 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Dynamic Smart Chips based on real menu */}
                {((msg.suggestedChips && msg.suggestedChips.length > 0) || (msg.id === "welcome" && dynamicWelcomeChips.length > 0)) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(msg.suggestedChips || dynamicWelcomeChips).map((chip, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, delay: 0.12 + idx * 0.05, ease: "easeOut" }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSend(chip)}
                        disabled={isLoading}
                        className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/10 border border-white/[0.07] hover:border-white/20 transition-all text-left active:scale-95 disabled:opacity-50"
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Product Recommendation Cards */}
                {msg.products && msg.products.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-2 pt-1"
                  >
                    <div className="flex items-center justify-between px-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Sugerencias de la carta:
                      </p>
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Icon icon="solar:eye-bold" className="text-xs" />
                        Toca para ver detalle
                      </span>
                    </div>
                    <div className="space-y-2">
                      {msg.products.map((prod) => {
                        const isAdded = addedItemIds.has(prod.id);
                        const isDiy = prod.is_diy || prod.is_build_your_own;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleOpenProductDetail(prod)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-emerald-500/40 transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                              {(prod.image || prod.image_url) && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/30 flex-shrink-0 relative">
                                  <AAImage
                                    src={prod.image || prod.image_url}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                    <Icon icon="solar:eye-bold" className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                                    {prod.name}
                                  </h4>
                                  <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200">🔍</span>
                                </div>
                                <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                                  {formatCOP(prod.price)}
                                </p>
                                {prod.description && (
                                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                                    {prod.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(prod);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0 ${
                                isAdded
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "bg-white/[0.08] hover:bg-emerald-600 text-white"
                              }`}
                            >
                              <Icon icon={isAdded ? "heroicons:check" : "heroicons:plus"} className="text-xs" />
                              <span>{isAdded ? "Agregado" : "Agregar"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <AIAvatar avatar={assistantAvatar} className="w-7 h-7 shrink-0 mt-0.5 rounded-full ring-1 ring-white/10" />
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-neutral-400 rounded-tl-sm text-xs">
                <Icon icon="solar:sparkles-bold" className="text-emerald-400 text-sm animate-spin" />
                <span>{assistantName} está respondiendo...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 3. SLEEK FOOTER (Cart Strip + Minimal Input) */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex-shrink-0 z-20 px-3 sm:px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] bg-[#0e1014]/95 backdrop-blur-xl border-t border-white/[0.06]"
      >
        <div className="max-w-2xl mx-auto space-y-2">
          
          {/* Integrated Cart Strip - Responsive & No Overlap on Mobile */}
          {items.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-medium min-w-0 flex-1">
                <Icon icon="heroicons:shopping-bag" className="text-sm text-emerald-400 flex-shrink-0" />
                <span className="truncate">
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
                <span className="text-white/40">·</span>
                <span className="text-white font-bold whitespace-nowrap flex-shrink-0">
                  {formatCOP(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={openCartModal}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
              >
                <span>Ver Pedido</span>
                <Icon icon="heroicons:arrow-right" className="text-xs" />
              </button>
            </div>
          )}

          {/* Minimal Input Pill */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.07] focus-within:bg-white/[0.08] border border-white/[0.08] focus-within:border-white/20 rounded-full px-3 py-1 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Escribe a ${assistantName}...`}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none px-2.5 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                inputQuery.trim() && !isLoading
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm active:scale-95"
                  : "bg-white/5 text-neutral-500 cursor-not-allowed"
              }`}
              aria-label="Enviar mensaje"
            >
              <Icon icon="solar:plain-bold" className="text-sm rotate-45 -mr-0.5" />
            </button>
          </form>

        </div>
      </motion.footer>

      {/* 4. MODALES DE DETALLE DE PRODUCTO */}
      <ProductQuickView
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={() => setSelectedProduct(null)}
      />

      <DIYProductModal
        open={Boolean(selectedDiyProduct)}
        product={selectedDiyProduct}
        onClose={() => setSelectedDiyProduct(null)}
        onAdd={() => setSelectedDiyProduct(null)}
      />

    </motion.div>
  );
}
