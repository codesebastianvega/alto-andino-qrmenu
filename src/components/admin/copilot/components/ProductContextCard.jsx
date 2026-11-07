import { Pencil, UtensilsCrossed } from 'lucide-react';

export default function ProductContextCard({ product, recipesEnabled, onEditPrice, onCreateRecipe }) {
  if (!product) return null;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <UtensilsCrossed size={24} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Producto encontrado
          </p>
          <h3 className="mt-1 truncate text-base font-bold text-gray-950">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {product.description || 'Sin descripción'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-gray-900">
              $ {Number(product.price || 0).toLocaleString('es-CO')}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                product.recipe_id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {product.recipe_id ? 'Con receta' : 'Sin receta'}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onEditPrice}
          className="flex items-center justify-center gap-2 border-r border-gray-100 px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          <Pencil size={14} /> Editar precio
        </button>
        <button
          type="button"
          disabled={!recipesEnabled || Boolean(product.recipe_id)}
          onClick={onCreateRecipe}
          className="flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          <UtensilsCrossed size={14} />{' '}
          {product.recipe_id ? 'Receta vinculada' : 'Crear y vincular receta'}
        </button>
      </div>
    </article>
  );
}
