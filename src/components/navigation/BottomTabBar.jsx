import React, { useEffect, useMemo, useState } from "react";
import { Home, ReceiptText, ShieldAlert, Sparkles, Utensils } from "lucide-react";
import { useMenuData } from "../../context/MenuDataContext";
import { safeStorage as localStorage } from "../../utils/safeStorage";

export default function BottomTabBar({ currentHash, onAllergensOpen, showExperiences = true }) {
  const { restaurantSettings } = useMenuData();
  const [activeOrderId, setActiveOrderId] = useState(null);
  const primaryColor = restaurantSettings?.primary_color || "#BFAE78";

  useEffect(() => {
    const readActiveOrder = () => {
      try {
        setActiveOrderId(localStorage.getItem("aa_active_order"));
      } catch {
        setActiveOrderId(null);
      }
    };

    readActiveOrder();
    window.addEventListener("storage", readActiveOrder);
    window.addEventListener("aa:active-order", readActiveOrder);
    window.addEventListener("hashchange", readActiveOrder);

    return () => {
      window.removeEventListener("storage", readActiveOrder);
      window.removeEventListener("aa:active-order", readActiveOrder);
      window.removeEventListener("hashchange", readActiveOrder);
    };
  }, []);

  const tabs = useMemo(() => {
    const items = [
      { id: "inicio", label: "Inicio", icon: Home, hash: "#inicio" },
      { id: "menu", label: "Menú", icon: Utensils, hash: "#menu" },
    ];

    if (showExperiences) {
      items.push({ id: "experiencias", label: "Experiencias", icon: Sparkles, hash: "#experiencias" });
    }

    items.push({ id: "alergenos", label: "Alérgenos", icon: ShieldAlert, action: onAllergensOpen });

    if (activeOrderId) {
      items.push({ id: "pedido", label: "Pedido", icon: ReceiptText, hash: `#order/${activeOrderId}` });
    }

    return items;
  }, [activeOrderId, onAllergensOpen, showExperiences]);

  const activeTabId = useMemo(() => {
    if (currentHash === "#inicio") return "inicio";
    if (currentHash === "#experiencias") return "experiencias";
    if (currentHash?.startsWith("#order/")) return "pedido";
    if (!currentHash || currentHash === "#" || currentHash === "#menu") return "menu";
    return "menu";
  }, [currentHash]);

  const renderContent = (tab, isActive) => {
    const Icon = tab.icon;
    return (
      <>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-2xl transition-all"
          style={{
            backgroundColor: isActive ? `${primaryColor}1f` : "transparent",
            color: isActive ? primaryColor : "rgba(26,26,26,0.42)",
          }}
        >
          <Icon size={19} strokeWidth={isActive ? 2.6 : 2.2} />
        </span>
        <span className={`max-w-full truncate text-[10px] font-black leading-none ${isActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/45"}`}>
          {tab.label}
        </span>
        <span
          className="mt-0.5 h-1 w-1 rounded-full transition-opacity"
          style={{ backgroundColor: primaryColor, opacity: isActive ? 1 : 0 }}
        />
      </>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden" aria-label="Navegación principal">
      <div className="mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
        <div className="rounded-t-[1.5rem] border border-black/5 border-b-0 bg-white px-2 pt-2 shadow-[0_-14px_36px_rgba(0,0,0,0.08)]">
          <div className="grid grid-flow-col auto-cols-fr items-end gap-1">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const className = "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-colors active:scale-95";

              if (tab.action) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={tab.action}
                    className={className}
                    aria-label={tab.label}
                  >
                    {renderContent(tab, isActive)}
                  </button>
                );
              }

              return (
                <a key={tab.id} href={tab.hash} className={className} aria-current={isActive ? "page" : undefined}>
                  {renderContent(tab, isActive)}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
