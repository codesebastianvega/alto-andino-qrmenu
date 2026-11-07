import { useEffect } from 'react';
import { useAdminIngredients } from '../../../hooks/useAdminIngredients';
import { useAdminProviders } from '../../../hooks/useAdminProviders';
import { ShoppingListBoard } from '../ShoppingListBoard';

export function ListaComprasTab({ activeLocationId }) {
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { providers, fetchProviders } = useAdminProviders();

  useEffect(() => {
    fetchIngredients(activeLocationId);
    fetchProviders();
  }, [activeLocationId, fetchIngredients, fetchProviders]);

  return (
    <div className="animate-fade-in">
      <ShoppingListBoard ingredients={ingredients} providers={providers} />
    </div>
  );
}
