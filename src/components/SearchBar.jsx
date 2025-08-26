import { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Chip } from "./Buttons";

const SUGGESTIONS = ["Veggie", "Sin gluten", "Café", "Bowl del día"];

export default function SearchBar({ value = "", onQueryChange, showChips = false }) {
  const [internal, setInternal] = useState(value);

  useEffect(() => setInternal(value), [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      onQueryChange?.(internal);
    }, 200);
    return () => clearTimeout(handle);
  }, [internal, onQueryChange]);

  const handleChange = (e) => setInternal(e.target.value);

  const handleChip = (term) => {
    setInternal(term);
    onQueryChange?.(term);
  };

  return (
    <div role="search" aria-label="Buscar">
      <div className="relative">
        <Icon
          icon="mdi:magnify"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg"
        />
        <input
          id="search-input"
          type="search"
          placeholder="Buscar bowls, café, sándwich…"
          value={internal}
          onChange={handleChange}
          className="w-full py-2 pl-9 pr-3 rounded-full border border-black/10 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
        />
      </div>
      {showChips && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <Chip key={s} onClick={() => handleChip(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

