import { COP } from "../utils/money";
export default function FloatingCartBar({ count, total, onOpen }) {
  if (!count) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-alto-primary text-white shadow-lg px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold">
            {count} artículo{count > 1 ? "s" : ""}
          </span>{" "}
          · Total ${COP(total)}
        </div>
        <button
          onClick={onOpen}
          className="px-3 py-2 rounded-xl bg-white text-alto-primary text-sm font-semibold"
        >
          Ver carrito
        </button>
      </div>
    </div>
  );
}
