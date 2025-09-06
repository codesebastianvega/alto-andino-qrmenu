// src/services/catalog.js
import supabase from "@/lib/supabaseClient";

export async function fetchCategories({ type } = {}) {
  if (!supabase) return [];
  let query = supabase
    .from("categories")
    .select("id,name,slug,parent_id,sort")
    .eq("is_active", true)
    .order("sort", { ascending: true })
    .order("name", { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function fetchProducts({ type } = {}) {
  if (!supabase) return [];
  let query = supabase
    .from("products")
    .select(
      "id,name,slug,type,category_id,price_cop,unit,image_url,tags,allergens,is_available,fulfillment_modes,stock,description,sort, categories(name,slug)"
    )
    .order("sort", { ascending: true })
    .order("name", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }

  return (
    data?.map((p) => ({
      ...p,
      category_name: p.categories?.name,
      category_slug: p.categories?.slug,
    })) || []
  );
}

export function subscribeAvailability(onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("products-availability")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "products" },
      (payload) => {
        const { new: newRow } = payload;
        if (newRow && ("is_available" in newRow || "stock" in newRow)) {
          onChange?.(newRow);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

