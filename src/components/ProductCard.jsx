import { formatCOP } from '../utils/money';
import { getStockState, slugify, isUnavailable } from '../utils/stock';
import { getProductImage } from '../utils/images';
import { StatusChip } from './Buttons';
import { toast } from './Toast';

export default function ProductCard({ item, onAdd, onQuickView }) {
  if (!item) return null;

  const productId = item.id || slugify(item.name);
  const st = getStockState(productId);
  const unavailable = st === 'out' || isUnavailable(item);

  const product = {
    productId,
    id: unavailable ? undefined : productId,
    title: item.name,
    name: item.name,
    subtitle: item.desc,
    price: item.price,
  };

  const handleQuickView = () => onQuickView?.(product);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleQuickView();
    }
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (unavailable) {
      toast('Producto no disponible');
      return;
    }
    onAdd?.({ productId, name: item.name, price: item.price, qty: 1 });
  };

  return (
    <article className="group grid grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white text-neutral-900 ring-1 ring-black/5 shadow-sm">
      <button
        type="button"
        onClick={handleQuickView}
        onKeyDown={handleKeyDown}
        aria-label={`Ver ${product.title || product.name || 'producto'}`}
        className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
      >
        <img
          src={getProductImage(product)}
          alt={item.name || 'Producto'}
          loading="lazy"
          className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
        />
      </button>
      <div className="min-w-0 flex flex-col">
        <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 truncate">{item.name}</h3>
        {item.desc && (
          <p className="mt-0.5 text-sm text-neutral-600 line-clamp-2">{item.desc}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {st === 'low' && <StatusChip variant="low">Pocas unidades</StatusChip>}
          {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base md:text-[17px] font-semibold text-neutral-900">
              {typeof item.price === 'number' ? formatCOP(item.price) : item.price}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Agregar ${item.name || 'producto'}`}
            onClick={handleAdd}
            className="h-10 w-10 md:h-11 md:w-11 grid place-items-center rounded-full bg-[#2f4131] hover:bg-[#263729] text-white shadow-sm ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

