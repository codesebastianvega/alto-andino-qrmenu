import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  addEdge, useEdgesState, useNodesState, MarkerType, useReactFlow, ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft, Beaker, Box, Check, ChevronDown, CirclePlus, LayoutDashboard,
  Layers3, Loader2, MessageSquareText, PackageSearch, PanelLeftClose,
  PanelLeftOpen, Plus, Save, Search, Send, ShieldAlert, Sparkles,
  UtensilsCrossed, WandSparkles, Wheat, X,
} from 'lucide-react';
import { supabase } from '../config/supabase';

const TYPE_META = {
  category: { label: 'Categoría', icon: Layers3, color: '#8b5cf6', tint: '#f5f3ff' },
  subcategory: { label: 'Subcategoría', icon: Box, color: '#6366f1', tint: '#eef2ff' },
  product: { label: 'Producto', icon: PackageSearch, color: '#0f766e', tint: '#ecfdf5' },
  recipe: { label: 'Receta', icon: UtensilsCrossed, color: '#d97706', tint: '#fffbeb' },
  ingredient: { label: 'Ingrediente', icon: Wheat, color: '#4d7c0f', tint: '#f7fee7' },
  allergen: { label: 'Alérgeno', icon: ShieldAlert, color: '#dc2626', tint: '#fef2f2' },
};

const NEXT_TYPES = {
  category: ['subcategory', 'product'],
  subcategory: ['product'],
  product: ['recipe'],
  recipe: ['ingredient'],
  ingredient: ['allergen'],
  allergen: [],
};

const COLUMN_X = { category: 80, subcategory: 390, product: 700, recipe: 1010, ingredient: 1320, allergen: 1630 };
const solidEdgeStyle = { stroke: '#1f7a4d', strokeWidth: 2 };
const draftEdgeStyle = { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6 5' };
const ghostEdgeStyle = { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '3 7' };
const EMPTY_DRAFTS = { categories: [], products: [], recipes: [], ingredients: [], allergens: [] };

function LabNode({ data, selected }) {
  const meta = TYPE_META[data.entityType] || TYPE_META.product;
  const Icon = meta.icon;
  return (
    <div
      className={`group relative min-w-[210px] max-w-[240px] rounded-xl border bg-white transition ${data.ghost ? 'border-dashed opacity-60 shadow-none' : 'shadow-[0_12px_28px_rgba(15,23,42,0.10)]'} ${selected ? 'ring-4 ring-emerald-300/40' : ''}`}
      style={{ borderColor: data.ghost ? '#94a3b8' : `${meta.color}45` }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white" style={{ background: data.ghost ? '#94a3b8' : meta.color }} />
      <div className="flex items-center gap-2.5 rounded-t-xl px-3 py-2.5" style={{ background: data.ghost ? '#f8fafc' : meta.tint }}>
        {data.imageUrl ? <img src={data.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm" style={{ color: data.ghost ? '#94a3b8' : meta.color }}><Icon size={18} /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: data.ghost ? '#64748b' : meta.color }}>{data.ghost ? 'Falta completar' : meta.label}</p>
          <p className="truncate text-sm font-black text-slate-900">{data.label}</p>
        </div>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        {data.description ? <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{data.description}</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {data.price != null ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">$ {Number(data.price).toLocaleString('es-CO')}</span> : null}
          {data.cost != null ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Costo $ {Math.round(Number(data.cost)).toLocaleString('es-CO')}</span> : null}
          {data.unit ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{data.unit}</span> : null}
          {data.draft ? <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">Borrador</span> : null}
          {data.edited ? <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">Editado</span> : null}
        </div>
      </div>
      {(NEXT_TYPES[data.entityType] || []).length > 0 ? (
        <button
          type="button"
          aria-label={`Conectar desde ${data.label}`}
          title="Añadir o conectar el siguiente nivel"
          onClick={(event) => { event.stopPropagation(); data.onExpand?.(data.nodeId); }}
          className="nodrag absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition hover:scale-110 hover:bg-emerald-600"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      ) : null}
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white" style={{ background: data.ghost ? '#94a3b8' : meta.color }} />
    </div>
  );
}

const nodeTypes = { lab: LabNode };

function normalize(text) {
  return String(text || '').trim().toLocaleLowerCase('es');
}

function makeSubcategory(name, categoryId = null) {
  return { id: `${categoryId || 'free'}:${normalize(name)}`, name, category_id: categoryId, entityType: 'subcategory' };
}

function toLibrary({ categories, products, recipes, ingredients, allergens }) {
  const seen = new Set();
  const subcategories = products.reduce((result, product) => {
    if (!product.subcategory) return result;
    const key = `${product.category_id || 'free'}:${normalize(product.subcategory)}`;
    if (!seen.has(key)) { seen.add(key); result.push(makeSubcategory(product.subcategory, product.category_id)); }
    return result;
  }, []);
  return [
    ...categories.map((item) => ({ ...item, entityType: 'category' })),
    ...subcategories,
    ...products.map((item) => ({ ...item, entityType: 'product' })),
    ...recipes.map((item) => ({ ...item, entityType: 'recipe' })),
    ...ingredients.map((item) => ({ ...item, entityType: 'ingredient' })),
    ...allergens.map((item) => ({ ...item, entityType: 'allergen' })),
  ];
}

function entityToNode(entity, index, position, onExpand) {
  const nodeId = `${entity.entityType}:${entity.id}`;
  return {
    id: nodeId,
    type: 'lab',
    position: position || { x: COLUMN_X[entity.entityType] ?? 740, y: 100 + index * 190 },
    data: {
      entityType: entity.entityType,
      entityId: entity.id,
      nodeId,
      label: entity.name,
      description: entity.description,
      imageUrl: entity.image_url,
      price: entity.entityType === 'product' ? entity.price : entity.target_price,
      cost: entity.entityType === 'ingredient' ? entity.unit_cost : entity.total_cost ?? entity.cost,
      unit: entity.usage_unit || entity.type,
      raw: entity,
      draft: entity.draft,
      ghost: entity.ghost,
      onExpand,
    },
  };
}

function makeEdge(source, target, kind = 'persisted', label = '') {
  const isDraft = kind === 'draft';
  const isGhost = kind === 'ghost';
  return {
    id: `${kind}:${source}>${target}`,
    source,
    target,
    label,
    animated: isDraft,
    style: isGhost ? ghostEdgeStyle : isDraft ? draftEdgeStyle : solidEdgeStyle,
    markerEnd: { type: MarkerType.ArrowClosed, color: isGhost ? '#94a3b8' : isDraft ? '#8b5cf6' : '#1f7a4d' },
    data: { draft: isDraft, ghost: isGhost, persisted: kind === 'persisted' },
  };
}

function catalogKey(type) {
  const map = { category: 'categories', product: 'products', recipe: 'recipes', ingredient: 'ingredients', allergen: 'allergens' };
  return map[type] || null;
}

function AlunaLabCanvas({ brand, onBack }) {
  const flow = useReactFlow();
  const flowWrapper = useRef(null);
  const [catalog, setCatalog] = useState({ categories: [], products: [], recipes: [], ingredients: [], allergens: [] });
  const [draftCatalog, setDraftCatalog] = useState(EMPTY_DRAFTS);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [connector, setConnector] = useState(null);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [connectorType, setConnectorType] = useState(null);
  const [newName, setNewName] = useState('');
  const [inlineCreateName, setInlineCreateName] = useState('');
  const [alunaOpen, setAlunaOpen] = useState(true);
  const [alunaPrompt, setAlunaPrompt] = useState('');
  const [notice, setNotice] = useState('');

  const openConnector = useCallback((nodeId) => {
    setConnector({ sourceId: nodeId });
    setConnectorSearch(''); setConnectorType(null); setNewName('');
  }, []);

  useEffect(() => {
    if (!brand?.id) return;
    const load = async () => {
      setLoading(true); setError('');
      const [categoriesRes, productsRes, recipesRes, ingredientsRes, allergensRes] = await Promise.all([
        supabase.from('categories').select('id,name,banner_description,is_active').eq('brand_id', brand.id).order('sort_order'),
        supabase.from('products').select('id,name,description,price,cost,margin,image_url,category_id,subcategory,recipe_id,is_active,tags').eq('brand_id', brand.id).eq('is_addon', false).order('name'),
        supabase.from('recipes').select('id,name,description,total_cost,target_price,recipe_ingredients(ingredient_id,quantity,ingredients(id,name,description,usage_unit,unit_cost))').eq('brand_id', brand.id).order('name'),
        supabase.from('ingredients').select('id,name,description,usage_unit,unit_cost,is_active').eq('brand_id', brand.id).order('name'),
        supabase.from('allergens').select('id,name,emoji,type').eq('brand_id', brand.id).order('name'),
      ]);
      const failure = [categoriesRes, productsRes, recipesRes, ingredientsRes, allergensRes].find((result) => result.error)?.error;
      if (failure) { setError(failure.message); setLoading(false); return; }
      setCatalog({
        categories: (categoriesRes.data || []).map((category) => ({ ...category, description: category.banner_description })),
        products: productsRes.data || [], recipes: recipesRes.data || [], ingredients: ingredientsRes.data || [], allergens: allergensRes.data || [],
      });
      setLoading(false);
    };
    load();
  }, [brand?.id]);

  const fullCatalog = useMemo(() => ({
    categories: [...catalog.categories, ...draftCatalog.categories],
    products: [...catalog.products, ...draftCatalog.products],
    recipes: [...catalog.recipes, ...draftCatalog.recipes],
    ingredients: [...catalog.ingredients, ...draftCatalog.ingredients],
    allergens: [...catalog.allergens, ...draftCatalog.allergens],
  }), [catalog, draftCatalog]);
  const library = useMemo(() => toLibrary(fullCatalog), [fullCatalog]);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const sourceNode = useMemo(() => nodes.find((node) => node.id === connector?.sourceId) || null, [nodes, connector]);
  const nextTypes = sourceNode ? NEXT_TYPES[sourceNode.data.entityType] || [] : [];
  const activeConnectorType = connectorType || nextTypes[0];

  const filteredLibrary = useMemo(() => library.filter((item) => {
    if (filter !== 'all' && item.entityType !== filter) return false;
    return !search.trim() || normalize(item.name).includes(normalize(search));
  }), [library, filter, search]);

  const connectorOptions = useMemo(() => library.filter((item) => {
    if (item.entityType !== activeConnectorType) return false;
    if (activeConnectorType === 'subcategory' && sourceNode?.data.entityType === 'category' && item.category_id !== sourceNode.data.entityId) return false;
    if (activeConnectorType === 'product' && sourceNode?.data.entityType === 'category' && item.category_id !== sourceNode.data.entityId) return false;
    if (activeConnectorType === 'product' && sourceNode?.data.entityType === 'subcategory' && normalize(item.subcategory) !== normalize(sourceNode.data.label)) return false;
    if (activeConnectorType === 'allergen' && item.type === 'diet') return false;
    return !connectorSearch || normalize(item.name).includes(normalize(connectorSearch));
  }), [activeConnectorType, connectorSearch, library, sourceNode]);

  const addEntity = useCallback((entity, position) => {
    const nodeId = `${entity.entityType}:${entity.id}`;
    setNodes((current) => current.some((node) => node.id === nodeId) ? current : [...current, entityToNode(entity, current.length, position, openConnector)]);
    return nodeId;
  }, [openConnector, setNodes]);

  const addDraftEdge = useCallback((source, target, label = 'Nueva relación', kind = 'draft') => {
    setEdges((current) => current.some((edge) => edge.source === source && edge.target === target)
      ? current
      : [...current, makeEdge(source, target, kind, label)]);
  }, [setEdges]);

  const addDraftToCatalog = useCallback((entity) => {
    const key = catalogKey(entity.entityType);
    if (!key) return;
    setDraftCatalog((current) => ({
      ...current,
      [key]: current[key].some((item) => item.id === entity.id) ? current[key] : [...current[key], entity],
    }));
  }, []);

  const reviveGhostNode = useCallback((nodeId, entity) => {
    setNodes((current) => current.map((node) => node.id === nodeId ? {
      ...node,
      data: {
        ...node.data,
        entityId: entity.id,
        label: entity.name,
        description: entity.description || node.data.description,
        price: entity.price ?? node.data.price,
        cost: entity.unit_cost ?? entity.total_cost ?? node.data.cost,
        unit: entity.usage_unit || entity.type || node.data.unit,
        raw: entity,
        ghost: false,
        draft: true,
        edited: true,
      },
    } : node));
    setEdges((current) => current.map((edge) => edge.target === nodeId || edge.source === nodeId ? {
      ...edge,
      animated: true,
      style: draftEdgeStyle,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
      data: { ...edge.data, ghost: false, draft: true },
      label: edge.label?.startsWith('falta') ? 'Nueva relación' : edge.label,
    } : edge));
  }, [setEdges, setNodes]);

  const autoLayout = useCallback((fit = true) => {
    setNodes((current) => {
      const counters = {};
      return current.map((node) => {
        const type = node.data.entityType;
        const row = counters[type] || 0;
        counters[type] = row + 1;
        return { ...node, position: { x: COLUMN_X[type] ?? 740, y: 90 + row * 200 } };
      });
    });
    if (fit) window.setTimeout(() => flow.fitView({ padding: 0.18, duration: 550, maxZoom: 1 }), 50);
    setNotice('Mapa organizado por jerarquía');
  }, [flow, setNodes]);

  const showProductEcosystem = useCallback((product) => {
    const related = [];
    const category = fullCatalog.categories.find((item) => item.id === product.category_id);
    const recipe = fullCatalog.recipes.find((item) => item.id === product.recipe_id);
    const categoryEntity = category
      ? { ...category, entityType: 'category' }
      : { id: `missing-category-${product.id}`, name: 'Categoría pendiente', entityType: 'category', ghost: true };
    const productEntity = { ...product, entityType: 'product' };
    related.push(categoryEntity);
    let subcategoryEntity = null;
    if (product.subcategory) { subcategoryEntity = makeSubcategory(product.subcategory, product.category_id); related.push(subcategoryEntity); }
    related.push(productEntity);
    const recipeEntity = recipe
      ? { ...recipe, entityType: 'recipe' }
      : { id: `missing-recipe-${product.id}`, name: 'Receta pendiente', description: 'Crea y vincula una receta para completar este producto.', entityType: 'recipe', ghost: true };
    related.push(recipeEntity);
    const usages = recipe?.recipe_ingredients || [];
    const productTags = Array.isArray(product.tags) ? product.tags : [];
    const taggedAllergens = fullCatalog.allergens.filter((item) => item.type !== 'diet' && productTags.includes(item.name));
    if (usages.length) usages.forEach((usage) => related.push({ ...(usage.ingredients || fullCatalog.ingredients.find((item) => item.id === usage.ingredient_id)), id: usage.ingredient_id, entityType: 'ingredient' }));
    else related.push({ id: `missing-ingredients-${product.id}`, name: 'Ingredientes pendientes', description: 'Añade los insumos y cantidades de la receta.', entityType: 'ingredient', ghost: true });
    if (taggedAllergens.length) taggedAllergens.forEach((allergen) => related.push({ ...allergen, entityType: 'allergen' }));
    else related.push({ id: `missing-allergens-${product.id}`, name: 'Alérgenos por validar', description: 'Confirma si algún ingrediente contiene alérgenos.', entityType: 'allergen', ghost: true });

    const nextNodes = related.filter(Boolean).map((entity, index) => entityToNode(entity, index, undefined, openConnector));
    const categoryId = `${categoryEntity.entityType}:${categoryEntity.id}`;
    const productId = `product:${product.id}`;
    const recipeId = `recipe:${recipeEntity.id}`;
    const nextEdges = [];
    if (subcategoryEntity) {
      const subId = `subcategory:${subcategoryEntity.id}`;
      nextEdges.push(makeEdge(categoryId, subId, categoryEntity.ghost ? 'ghost' : 'persisted', 'clasifica'));
      nextEdges.push(makeEdge(subId, productId, 'persisted', 'contiene'));
    } else nextEdges.push(makeEdge(categoryId, productId, categoryEntity.ghost ? 'ghost' : 'persisted', 'contiene'));
    nextEdges.push(makeEdge(productId, recipeId, recipeEntity.ghost ? 'ghost' : 'persisted', recipe ? 'usa receta' : 'falta receta'));
    if (usages.length) usages.forEach((usage) => nextEdges.push(makeEdge(recipeId, `ingredient:${usage.ingredient_id}`, 'persisted', `${usage.quantity} ${usage.ingredients?.usage_unit || ''}`.trim())));
    else nextEdges.push(makeEdge(recipeId, `ingredient:missing-ingredients-${product.id}`, 'ghost', 'falta definir'));
    const ingredientTargets = usages.length ? usages.map((usage) => `ingredient:${usage.ingredient_id}`) : [`ingredient:missing-ingredients-${product.id}`];
    const allergenTargets = taggedAllergens.length ? taggedAllergens.map((allergen) => `allergen:${allergen.id}`) : [`allergen:missing-allergens-${product.id}`];
    ingredientTargets.forEach((ingredientId) => {
      allergenTargets.forEach((allergenId) => nextEdges.push(makeEdge(ingredientId, allergenId, 'ghost', taggedAllergens.length ? 'validar origen' : 'falta validar')));
    });
    setNodes(nextNodes); setEdges(nextEdges); setSelectedNodeId(productId);
    window.setTimeout(() => autoLayout(true), 50);
  }, [autoLayout, fullCatalog, openConnector, setEdges, setNodes]);

  const addFromLibrary = useCallback((entity) => {
    if (entity.entityType === 'product') { showProductEcosystem(entity); return; }
    addEntity(entity);
    window.setTimeout(() => autoLayout(false), 20);
  }, [addEntity, autoLayout, showProductEcosystem]);

  const connectEntity = (entity) => {
    if (!sourceNode) return;
    const sourceId = sourceNode.id;
    const targetId = addEntity(entity, { x: sourceNode.position.x + 330, y: sourceNode.position.y });
    addDraftEdge(sourceId, targetId);
    setConnector(null);
    window.setTimeout(() => autoLayout(false), 20);
  };

  const createDraft = () => {
    const name = newName.trim();
    if (!name || !sourceNode || !activeConnectorType) return;
    const ghostTarget = edges
      .filter((edge) => edge.source === sourceNode.id)
      .map((edge) => nodes.find((node) => node.id === edge.target))
      .find((node) => node?.data.ghost && node.data.entityType === activeConnectorType);
    const entity = {
      id: ghostTarget?.data.entityId || `draft-${crypto.randomUUID()}`,
      name,
      entityType: activeConnectorType,
      draft: true,
      category_id: sourceNode.data.entityType === 'category' ? sourceNode.data.entityId : sourceNode.data.raw?.category_id,
      subcategory: sourceNode.data.entityType === 'subcategory' ? sourceNode.data.label : null,
    };
    addDraftToCatalog(entity);
    if (ghostTarget) {
      reviveGhostNode(ghostTarget.id, entity);
      setSelectedNodeId(ghostTarget.id);
      setConnector(null);
    } else {
      connectEntity(entity);
    }
    setNotice(`${TYPE_META[activeConnectorType].label} creada como borrador`);
  };

  const createStandaloneDraft = (type) => {
    const entity = {
      id: `draft-${crypto.randomUUID()}`,
      name: `Nueva ${TYPE_META[type].label.toLowerCase()}`,
      entityType: type,
      draft: true,
    };
    addDraftToCatalog(entity);
    const nodeId = addEntity(entity);
    setSelectedNodeId(nodeId);
    setFilter(type);
    setNotice(`${TYPE_META[type].label} creada como borrador`);
  };

  const onConnect = useCallback((connection) => {
    setEdges((current) => addEdge({ ...connection, ...makeEdge(connection.source, connection.target, 'draft') }, current));
  }, [setEdges]);

  const updateSelected = (field, value) => {
    if (!selectedNodeId) return;
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? {
      ...node,
      data: {
        ...node.data,
        [field]: value,
        edited: true,
        draft: node.data.draft || node.data.ghost,
        ghost: false,
        raw: { ...node.data.raw, [field === 'label' ? 'name' : field]: value },
      },
    } : node));
  };

  const materializeSelectedDraft = () => {
    if (!selectedNodeId || !selectedNode?.data.ghost) return;
    const name = inlineCreateName.trim() || selectedNode.data.label;
    const entity = {
      ...selectedNode.data.raw,
      id: selectedNode.data.entityId,
      name,
      description: selectedNode.data.description,
      entityType: selectedNode.data.entityType,
      draft: true,
    };
    addDraftToCatalog(entity);
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? {
      ...node,
      data: {
        ...node.data,
        label: name,
        ghost: false,
        draft: true,
        edited: true,
        raw: entity,
      },
    } : node));
    setEdges((current) => current.map((edge) => edge.target === selectedNodeId || edge.source === selectedNodeId ? {
      ...edge,
      animated: true,
      style: draftEdgeStyle,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
      data: { ...edge.data, ghost: false, draft: true },
      label: edge.label?.startsWith('falta') ? 'Nueva relación' : edge.label,
    } : edge));
    setInlineCreateName('');
    setNotice(`${TYPE_META[selectedNode.data.entityType].label} creada como borrador`);
  };

  const selectedNextTypes = selectedNode ? NEXT_TYPES[selectedNode.data.entityType] || [] : [];
  const selectedNextLabel = selectedNextTypes.length ? TYPE_META[selectedNextTypes[0]]?.label?.toLowerCase() : '';
  const alunaSuggestions = selectedNode
    ? [
        `Crear ${selectedNextLabel || 'siguiente paso'} para ${selectedNode.data.label}`,
        `Validar faltantes de ${selectedNode.data.label}`,
        'Ordenar este flujo por jerarquía',
      ]
    : ['Revisar productos sin receta', 'Crear receta para un producto', 'Organizar el canvas'];

  const runAlunaSuggestion = (text) => {
    const lower = normalize(text);
    if (lower.includes('ordenar') || lower.includes('organizar')) {
      autoLayout(true);
      return;
    }
    if (selectedNode && (lower.includes('crear') || lower.includes('siguiente') || lower.includes('receta'))) {
      if (selectedNextTypes.length) openConnector(selectedNode.id);
      else setNotice('Este nodo no tiene un siguiente nivel configurado');
      return;
    }
    setNotice('Aluna dejó la tarea como nota para esta prueba');
  };

  const draftEdges = edges.filter((edge) => edge.data?.draft);
  const changedNodes = nodes.filter((node) => node.data.draft || node.data.edited);

  return (
    <div className="flex h-screen min-h-[720px] w-full flex-col overflow-hidden bg-slate-950 text-slate-900">
      <header className="relative z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 text-white backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"><ArrowLeft size={18} /></button>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><Beaker size={20} /></span>
          <div><div className="flex items-center gap-2"><h1 className="text-sm font-black">Aluna Lab</h1><span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-violet-200">Experimental</span></div><p className="text-[10px] text-white/40">{brand?.name || 'Canvas gastronómico'} · espacio prácticamente ilimitado</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAlunaOpen((current) => !current)} className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${alunaOpen ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><MessageSquareText size={15} /> <span className="hidden sm:inline">Aluna</span></button>
          <button type="button" onClick={() => autoLayout(true)} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold hover:bg-white/10"><LayoutDashboard size={15} /> <span className="hidden sm:inline">Auto-organizar</span></button>
          <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/55 lg:block">{nodes.length} nodos · {draftEdges.length + changedNodes.length} cambios</div>
          <button type="button" onClick={() => setReviewOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-emerald-950 hover:bg-emerald-400"><Save size={15} /> Revisar</button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1" ref={flowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          minZoom={0.04}
          maxZoom={2.5}
          translateExtent={[[-100000, -100000], [100000, 100000]]}
          nodeExtent={[[-90000, -90000], [90000, 90000]]}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          proOptions={{ hideAttribution: true }}
          className="bg-[#f7f8fa]"
        >
          <Background color="#cbd5e1" gap={24} size={1.2} />
          <Controls position="bottom-right" className="!bottom-5 !right-5 overflow-hidden !rounded-xl !border-slate-200 !shadow-xl" />
          <MiniMap position="bottom-right" className="!bottom-5 !right-20 !h-24 !w-40 !rounded-xl !border !border-slate-200 !bg-white/90 !shadow-xl" nodeColor={(node) => TYPE_META[node.data.entityType]?.color || '#64748b'} maskColor="rgba(241,245,249,.72)" pannable zoomable />
        </ReactFlow>

        <aside className={`absolute bottom-4 left-4 top-4 z-20 flex w-[286px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform ${libraryOpen ? 'translate-x-0' : '-translate-x-[310px]'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Biblioteca</p><h2 className="text-sm font-black">Elementos del negocio</h2></div><button type="button" onClick={() => setLibraryOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><PanelLeftClose size={17} /></button></div>
          <div className="space-y-3 p-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={14} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto, ingrediente..." className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
            <div className="grid grid-cols-2 gap-2">
              {['category', 'product', 'recipe', 'ingredient'].map((type) => <button key={type} type="button" onClick={() => createStandaloneDraft(type)} className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-black text-emerald-800 hover:bg-emerald-100"><Plus size={12} /> {TYPE_META[type].label}</button>)}
            </div>
            <div className="flex flex-wrap gap-1.5">{['all', ...Object.keys(TYPE_META)].map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-full px-2.5 py-1 text-[9px] font-black ${filter === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{type === 'all' ? 'Todo' : TYPE_META[type].label}</button>)}</div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">{loading ? <div className="flex h-40 items-center justify-center text-emerald-600"><Loader2 className="animate-spin" /></div> : error ? <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : filteredLibrary.map((item) => { const meta = TYPE_META[item.entityType]; const Icon = meta.icon; return <button type="button" key={`${item.entityType}:${item.id}`} onClick={() => addFromLibrary(item)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-emerald-200 hover:shadow-md"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: meta.tint, color: meta.color }}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span><span className="block truncate text-xs font-bold text-slate-800">{item.name}</span></span>{item.entityType === 'product' ? <WandSparkles size={13} className="text-emerald-500" /> : <CirclePlus size={14} className="text-slate-300" />}</button>; })}</div>
        </aside>
        {!libraryOpen ? <button type="button" onClick={() => setLibraryOpen(true)} className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xl"><PanelLeftOpen size={18} /></button> : null}

        {selectedNode ? (
          <aside className="absolute bottom-4 right-4 top-4 z-20 flex w-[330px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: TYPE_META[selectedNode.data.entityType]?.color }}>{TYPE_META[selectedNode.data.entityType]?.label}</p><h2 className="text-sm font-black">Editar información</h2></div><button type="button" onClick={() => setSelectedNodeId(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={17} /></button></div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre</span><input value={selectedNode.data.label || ''} onChange={(event) => updateSelected('label', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-400" /></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Descripción</span><textarea value={selectedNode.data.description || ''} onChange={(event) => updateSelected('description', event.target.value)} rows={5} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-emerald-400" placeholder="Describe este elemento..." /></label>
              {selectedNode.data.entityType === 'product' ? <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Precio de venta</span><input type="number" min="0" value={selectedNode.data.price ?? ''} onChange={(event) => updateSelected('price', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-400" /></label> : null}
              {selectedNode.data.entityType === 'ingredient' ? <><label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Costo unitario</span><input type="number" min="0" value={selectedNode.data.cost ?? ''} onChange={(event) => updateSelected('cost', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-400" /></label><label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Unidad</span><input value={selectedNode.data.unit || ''} onChange={(event) => updateSelected('unit', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-400" placeholder="g, ml, unidad..." /></label></> : null}
              {selectedNode.data.ghost ? <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/70 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-violet-700">Crear este pendiente</p><div className="flex gap-2"><input value={inlineCreateName} onChange={(event) => setInlineCreateName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') materializeSelectedDraft(); }} placeholder={selectedNode.data.label} className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-xs outline-none focus:border-violet-400" /><button type="button" onClick={materializeSelectedDraft} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Crear</button></div></div> : null}
              {selectedNextTypes.length ? <button type="button" onClick={() => openConnector(selectedNode.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-emerald-700"><Plus size={15} /> Crear o vincular {TYPE_META[selectedNextTypes[0]]?.label.toLowerCase()}</button> : null}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800">La edición queda como propuesta local hasta que confirmemos el flujo de publicación.</div>
            </div>
          </aside>
        ) : null}

        {nodes.length === 0 && !loading ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-xl backdrop-blur"><Sparkles className="mx-auto mb-3 text-emerald-500" /><h2 className="text-lg font-black">Construye el mapa de tu menú</h2><p className="mt-2 text-xs leading-relaxed text-slate-500">Elige un producto para desplegar automáticamente su categoría, subcategoría, receta e ingredientes. Los faltantes aparecerán como tarjetas fantasma.</p></div></div> : null}
        {notice ? <button type="button" onClick={() => setNotice('')} className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xl"><Check size={14} className="text-emerald-400" />{notice}</button> : null}
        {alunaOpen ? (
          <aside className={`absolute bottom-4 z-20 w-[330px] overflow-hidden rounded-2xl border border-emerald-200 bg-white/95 shadow-2xl backdrop-blur-xl ${selectedNode ? 'right-[362px]' : 'right-4'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100"><MessageSquareText size={17} /></span>
                <div><p className="text-sm font-black text-slate-900">Aluna</p><p className="text-[10px] font-semibold text-slate-400">{selectedNode ? selectedNode.data.label : 'Asistente del canvas'}</p></div>
              </div>
              <button type="button" onClick={() => setAlunaOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                {alunaSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => runAlunaSuggestion(suggestion)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50">
                    <span className="line-clamp-1">{suggestion}</span>
                    <WandSparkles size={13} className="shrink-0 text-emerald-600" />
                  </button>
                ))}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); runAlunaSuggestion(alunaPrompt); setAlunaPrompt(''); }} className="flex gap-2">
                <input value={alunaPrompt} onChange={(event) => setAlunaPrompt(event.target.value)} placeholder="Pídele algo a Aluna..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400" />
                <button type="submit" disabled={!alunaPrompt.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:opacity-40"><Send size={15} /></button>
              </form>
            </div>
          </aside>
        ) : null}
      </main>

      {connector && sourceNode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setConnector(null); }}>
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Continuar desde</p><h3 className="mt-1 text-lg font-black">{sourceNode.data.label}</h3><p className="mt-1 text-xs text-slate-500">Elige qué nivel quieres conectar o créalo sin salir del canvas.</p></div><button type="button" onClick={() => setConnector(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="space-y-4 p-5">
              <div className="flex gap-2">{nextTypes.map((type) => <button key={type} type="button" onClick={() => setConnectorType(type)} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black ${activeConnectorType === type ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}`}>{TYPE_META[type].label}</button>)}</div>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search size={14} className="text-slate-400" /><input value={connectorSearch} onChange={(event) => setConnectorSearch(event.target.value)} placeholder={`Buscar ${TYPE_META[activeConnectorType]?.label.toLowerCase()} existente...`} className="h-11 min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
              <div className="max-h-48 space-y-2 overflow-y-auto">{connectorOptions.length ? connectorOptions.map((item) => <button key={`${item.entityType}:${item.id}`} type="button" onClick={() => connectEntity(item)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50"><span className="text-xs font-bold">{item.name}</span><ChevronDown size={14} className="-rotate-90 text-slate-400" /></button>) : <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">No encontramos opciones compatibles.</p>}</div>
              <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-violet-700">¿No existe? Créalo aquí</p><div className="flex gap-2"><input value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') createDraft(); }} placeholder={`Nombre de la ${TYPE_META[activeConnectorType]?.label.toLowerCase()}`} className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-xs outline-none focus:border-violet-400" /><button type="button" onClick={createDraft} disabled={!newName.trim()} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">Crear</button></div></div>
            </div>
          </div>
        </div>
      ) : null}

      {reviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Revisión segura</p><h2 className="mt-1 text-xl font-black">Cambios propuestos</h2></div><button type="button" onClick={() => setReviewOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 max-h-72 space-y-2 overflow-y-auto">{changedNodes.map((node) => <div key={node.id} className="rounded-xl border border-slate-100 p-3 text-xs"><span className="font-black">{node.data.label}</span><span className="ml-2 text-slate-400">{node.data.draft ? 'nuevo borrador' : 'información editada'}</span></div>)}{draftEdges.map((edge) => <div key={edge.id} className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs text-violet-800">Vincular <strong>{nodes.find((node) => node.id === edge.source)?.data.label}</strong> con <strong>{nodes.find((node) => node.id === edge.target)?.data.label}</strong></div>)}{!changedNodes.length && !draftEdges.length ? <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-400">Aún no hay cambios nuevos.</p> : null}</div><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Esta versión experimental no escribirá todavía en Supabase. Aquí validamos primero que la jerarquía y la edición sean intuitivas.</div><button type="button" onClick={() => setReviewOpen(false)} className="mt-4 w-full rounded-xl bg-slate-950 py-3 text-xs font-black text-white">Seguir editando</button></div></div>
      ) : null}
    </div>
  );
}

export default function AlunaLab(props) {
  return <ReactFlowProvider><AlunaLabCanvas {...props} /></ReactFlowProvider>;
}
