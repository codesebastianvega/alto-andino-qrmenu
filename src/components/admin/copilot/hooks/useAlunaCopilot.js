import { useEffect, useId, useRef, useState } from 'react';
import {
  chatWithAluna,
  executeAlunaAction,
  executeAlunaCatalogManagementAction,
  executeAlunaKitchenAction,
  executeAlunaOperationsAction,
  executeAlunaBrandWebAction,
  executeAlunaInventoryAction,
  executeAlunaVenueAction,
  listAlunaChanges,
  runOpeningAudit,
} from '../../../../services/alunaCopilot';
import { getPlanQuota } from '../../../../config/quotas';
import {
  FINDING_PAGES,
  priceReplyFallback,
  safeAssistantReply,
  detectTargetPage,
  parseStepsFromText,
  extractTipFromText,
} from '../helpers/copilotHelpers';

export function useAlunaCopilot({
  brand,
  location,
  locationId,
  onNavigate,
  recipesEnabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestedIntent, setSuggestedIntent] = useState(null);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [catalogDraft, setCatalogDraft] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [changes, setChanges] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [aiUsage, setAiUsage] = useState(brand?.ai_generations_used || 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const promptRef = useRef(null);
  const titleId = useId();

  const brandId = brand?.id;
  const brandName = brand?.name || 'tu negocio';
  const locationName = location?.name || (locationId ? 'Sede seleccionada' : 'Todas las sedes');
  const planQuota = getPlanQuota(brand?.plan_id);

  useEffect(() => {
    setAudit(null);
    setError('');
    setPrompt('');
    setWorkflow(null);
    setSuccess('');
    setMessages([]);
    setSuggestedIntent(null);
    setSuggestedReplies([]);
    setCatalogDraft({});
    setAvailableCategories([]);
    setChanges([]);
    setSelectedProduct(null);
    setAiUsage(brand?.ai_generations_used || 0);
    setIsOpen(false);
  }, [brandId, brand?.ai_generations_used]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const textarea = promptRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 48), 192)}px`;
  }, [prompt]);

  const executeAudit = async () => {
    if (!brandId || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      setAudit(await runOpeningAudit({ brandId, locationId }));
      setPrompt('');
    } catch (auditError) {
      setError(auditError.message || 'No pude completar la auditoría. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChanges = async () => {
    setIsLoading(true);
    setError('');
    try {
      setChanges(await listAlunaChanges({ brandId }));
    } catch (historyError) {
      setError(historyError.message || 'No pude cargar el historial.');
    } finally {
      setIsLoading(false);
    }
  };

  const openChanges = () => {
    setWorkflow('change_history');
    loadChanges();
  };

  const handleDeepNavigate = (pageId) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(pageId);
    window.dispatchEvent(new CustomEvent('aluna:navigate', { detail: { target: pageId } }));
  };

  const handleDeepPrefill = (pageId, prefillData) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(pageId);
    window.dispatchEvent(
      new CustomEvent('aluna:prefill', {
        detail: { target: pageId, data: prefillData },
      })
    );
  };

  const approveLocation = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_location', proposal });
      setSuccess(
        `${result.location.name} fue creada correctamente${
          result.default_hours_created ? ' con sus horarios iniciales' : ''
        }.`
      );
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude ejecutar el cambio aprobado.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveCatalog = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_catalog', proposal });
      setSuccess(
        `Aluna ${
          result.category_reused ? 'usó la categoría existente' : 'creó la categoría'
        } ${result.category.name}, agregó ${result.products.length} producto(s) y los vinculó a ${
          result.linked_locations
        } sede(s).`
      );
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude crear el catálogo aprobado.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveConsolidation = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({
        brandId,
        action: 'consolidate_categories',
        proposal,
      });
      setSuccess(
        `Aluna movió ${result.moved_products} producto(s) a ${result.target_category.name} y desactivó ${result.source_category.name}.`
      );
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude consolidar las categorías.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveCostedProduct = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaKitchenAction({ brandId, locationId, proposal });
      setSuccess(
        `Aluna creó ${result.product?.name || 'el producto'} con receta y costo por porción de $ ${Math.round(
          result.costing?.recipe_cost_per_serving || 0
        ).toLocaleString('es-CO')}.`
      );
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude crear el producto con receta.');
    } finally {
      setIsLoading(false);
    }
  };

  const approvePrice = async (price) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaCatalogManagementAction({
        brandId,
        locationId,
        action: 'update_product',
        proposal: { entity_id: selectedProduct.id, changes: { price } },
      });
      const updated = result.result?.record || { ...selectedProduct, price };
      setSelectedProduct((current) => ({ ...current, ...updated, price }));
      setSuccess(`Aluna actualizó el precio de ${selectedProduct.name} a $ ${price.toLocaleString('es-CO')}.`);
      setWorkflow(null);
    } catch (actionError) {
      setError(actionError.message || 'No pude actualizar el precio.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveOperations = async (action, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaOperationsAction({
        brandId,
        locationId,
        action,
        proposal,
      });
      const labels = {
        update_business_hours: 'actualizó los horarios',
        create_payment_method: `creó el método ${result.payment_method?.name || 'de pago'}`,
        update_printing_settings: `configuró la impresión en ${
          result.settings?.thermal_paper_width || proposal.thermal_paper_width
        } mm`,
        create_modifier_group: `creó el grupo ${result.modifier_group?.name || 'de modificadores'}`,
        update_delivery_settings: 'actualizó las tarifas y cobertura de domicilios',
        update_support_whatsapp: 'actualizó el número de WhatsApp y soporte',
        update_service_fee: 'actualizó el porcentaje de propina y servicio sugerido',
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio operativo'} correctamente.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude aplicar el cambio operativo.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveBrandWeb = async (action, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaBrandWebAction({ brandId, action, proposal });
      const labels = {
        update_branding_urls: 'actualizó la identidad y color de la marca',
        update_branding: 'actualizó la identidad y color de la marca',
        update_web_content: 'actualizó los textos de la página web',
        update_business_profile: 'actualizó los datos del perfil comercial',
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio de diseño'} correctamente.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude aplicar el cambio de diseño o web.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveInventory = async (action, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaInventoryAction({ brandId, locationId, action, proposal });
      if (action === 'generate_shopping_list') {
        const text = result.formatted_text || 'Lista de mercado generada.';
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        setSuccess(`Aluna generó la lista de mercado (${result.items_count || 0} insumos). ¡Copiada al portapapeles!`);
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: text,
          },
        ]);
      } else {
        const count = result.updated_ingredients?.length || 0;
        setSuccess(`Aluna registró la entrada de ${count} insumo(s) al inventario correctamente.`);
      }
      setWorkflow(null);
    } catch (actionError) {
      setError(actionError.message || 'No pude procesar la acción de inventario.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveVenue = async (action, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaVenueAction({ brandId, locationId, action, proposal });
      const count = result.created_count || result.tables?.length || 0;
      setSuccess(
        `Aluna creó ${count} mesa(s) exitosamente${
          result.area_name ? ` en ${result.area_name}` : ''
        }. Códigos QR listos.`
      );
      setWorkflow(null);
    } catch (actionError) {
      setError(actionError.message || 'No pude procesar la acción de mesas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProposalCard = (card) => {
    if (!card) return;
    if (card.action === 'create_catalog' || card.draftType === 'catalog') {
      const draft = card.draft || catalogDraft;
      const productName = String(draft.product_name || '').trim();
      const price = Number(draft.price);
      const categoryName = String(draft.category_name || '').trim() || 'General';
      const description =
        String(draft.description || '').trim() || `${productName} preparado fresco.`;
      const selectedMods = (card.suggestedModifiers || [])
        .filter((m) => m.selected !== false)
        .map((m) => m.name);

      if (productName && price > 0) {
        if (card.productMode === 'recipe') {
          setSelectedProduct({ name: productName, price, category_name: categoryName });
          setCatalogDraft((prev) => ({
            ...prev,
            product_name: productName,
            price,
            category_name: categoryName,
            description,
          }));
          setWorkflow('create_costed_product');
          return;
        }

        approveCatalog({
          category_name: categoryName,
          modifier_group_names: selectedMods,
          products: [
            {
              name: productName,
              description,
              price,
              tags: draft.tags || [],
              requires_kitchen: draft.requires_kitchen !== false,
              modifier_group_names: selectedMods,
            },
          ],
        });
        return;
      }

      setWorkflow('create_catalog');
    } else if (card.action === 'create_costed_product') {
      setWorkflow('create_costed_product');
    } else if (card.action === 'create_location') {
      setWorkflow('create_location');
    } else if (card.action === 'edit_product_price' && card.product) {
      setSelectedProduct(card.product);
      setWorkflow('edit_product_price');
    } else if (
      [
        'update_business_hours',
        'create_payment_method',
        'update_printing_settings',
        'create_modifier_group',
      ].includes(card.action)
    ) {
      setWorkflow(card.action);
    } else if (
      ['update_delivery_settings', 'update_support_whatsapp', 'update_service_fee'].includes(
        card.action
      )
    ) {
      approveOperations(card.action, card.operationsDraft || card.draft || {});
    } else if (
      ['update_branding', 'update_branding_urls', 'update_web_content'].includes(card.action)
    ) {
      approveBrandWeb(card.action, card.webDraft || card.draft || {});
    } else if (['batch_stock_entry', 'generate_shopping_list'].includes(card.action)) {
      approveInventory(card.action, card.inventoryDraft || card.draft || {});
    } else if (card.action === 'create_table_batch') {
      approveVenue(card.action, card.tableDraft || card.draft || {});
    }
  };

  const handleDismissCard = (index) => {
    setMessages((current) => current.map((m, i) => (i === index ? { ...m, card: null } : m)));
  };

  const handleCardFieldChange = (messageIndex, fieldKey, value) => {
    setMessages((current) =>
      current.map((m, idx) => {
        if (idx !== messageIndex || !m.card) return m;
        const updatedCard = { ...m.card };
        const updatedDraft = { ...(updatedCard.draft || {}), [fieldKey]: value };
        updatedCard.draft = updatedDraft;

        updatedCard.beforeAfter = (updatedCard.beforeAfter || []).map((item) => {
          if (item.key === fieldKey) {
            return { ...item, after: value, value };
          }
          return item;
        });

        const hasName = Boolean(String(updatedDraft.product_name || '').trim());
        const hasPrice = Number(updatedDraft.price) > 0;
        updatedCard.isDraft = !hasName || !hasPrice;

        return { ...m, card: updatedCard };
      })
    );

    setCatalogDraft((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleCardProductModeChange = (messageIndex, mode) => {
    setMessages((current) =>
      current.map((m, idx) => {
        if (idx !== messageIndex || !m.card) return m;
        return { ...m, card: { ...m.card, productMode: mode } };
      })
    );
  };

  const handleCardToggleModifier = (messageIndex, modifierName) => {
    setMessages((current) =>
      current.map((m, idx) => {
        if (idx !== messageIndex || !m.card) return m;
        const updatedMods = (m.card.suggestedModifiers || []).map((mod) => {
          if (mod.name === modifierName) {
            return { ...mod, selected: !mod.selected };
          }
          return mod;
        });
        return { ...m, card: { ...m.card, suggestedModifiers: updatedMods } };
      })
    );
  };

  const sendMessage = async (rawMessage) => {
    const userMessage = String(rawMessage || '').trim();
    if (!userMessage || isLoading) return;
    setPrompt('');
    setSuggestedReplies([]);
    setError('');
    setSuccess('');
    setMessages((current) => [...current, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await chatWithAluna({
        brandId,
        locationId,
        message: userMessage,
        history: messages,
        draft: catalogDraft,
        features: { recipes_enabled: recipesEnabled },
      });
      const assistantReply = safeAssistantReply(response.reply);

      // ─── Detect Camino Card representation ───
      let card = null;
      const lowerUser = userMessage.toLowerCase();
      const isPlanQuery =
        /cu[aá]l.*plan|cu[aá]ntos?.*token|cu[aá]ntas?.*consulta|mi.*plan|l[ií]mite.*ia|cuota/i.test(
          lowerUser
        );

      if (isPlanQuery) {
        const planId = brand?.plan_id || 'plan_esencial';
        const planName =
          brand?.plans?.name ||
          (planId.includes('premium')
            ? 'Premium'
            : planId.includes('profesional')
            ? 'Profesional'
            : planId.includes('esencial')
            ? 'Esencial'
            : 'Emprendedor');
        const allowedCaminos =
          planId.includes('premium') || planId.includes('profesional')
            ? [1, 2, 3]
            : planId.includes('esencial')
            ? [1, 2]
            : [1];
        const monthlyLimit = planId.includes('premium')
          ? 1000
          : planId.includes('profesional')
          ? 300
          : planId.includes('esencial')
          ? 100
          : 30;
        card = {
          type: 'plan_info',
          planName,
          usage: brand?.ai_generations_used || 0,
          monthlyLimit,
          caminos: allowedCaminos,
        };
      } else if (response.intent === 'update_delivery_settings') {
        const opDraft = response.operations_draft || {};
        const beforeFee =
          response.current_delivery_fee !== null
            ? `$ ${Number(response.current_delivery_fee).toLocaleString('es-CO')}`
            : 'Sin costo';
        const afterFee =
          opDraft.delivery_fee !== undefined
            ? `$ ${Number(opDraft.delivery_fee).toLocaleString('es-CO')}`
            : beforeFee;
        const beforeRad = response.current_delivery_radius
          ? `${response.current_delivery_radius} km`
          : 'Radio estándar';
        const afterRad = opDraft.delivery_radius_km
          ? `${opDraft.delivery_radius_km} km`
          : beforeRad;

        card = {
          type: 'proposal',
          title: 'Tarifas y cobertura de domicilios',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Costo base domicilio', before: beforeFee, after: afterFee },
            { label: 'Radio de cobertura', before: beforeRad, after: afterRad },
          ],
          riskLevel: 'medium',
          action: 'update_delivery_settings',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_support_whatsapp') {
        const opDraft = response.operations_draft || {};
        const beforeWa = response.current_whatsapp || 'No configurado';
        const afterWa = opDraft.whatsapp_number_orders || opDraft.support_phone || 'Por definir';

        card = {
          type: 'proposal',
          title: 'Canal de WhatsApp para pedidos',
          summary: assistantReply,
          beforeAfter: [{ label: 'Línea de WhatsApp', before: beforeWa, after: afterWa }],
          riskLevel: 'low',
          action: 'update_support_whatsapp',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_service_fee') {
        const opDraft = response.operations_draft || {};
        const beforeFee =
          response.current_service_fee !== null ? `${response.current_service_fee}%` : 'Desactivado';
        const afterFee =
          opDraft.service_fee_percentage !== undefined
            ? `${opDraft.service_fee_percentage}% (${
                opDraft.is_service_fee_enabled !== false ? 'Activo' : 'Inactivo'
              })`
            : beforeFee;

        card = {
          type: 'proposal',
          title: 'Propina y servicio sugerido',
          summary: assistantReply,
          beforeAfter: [{ label: 'Servicio sugerido', before: beforeFee, after: afterFee }],
          riskLevel: 'medium',
          action: 'update_service_fee',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_branding') {
        const webDraft = response.web_draft || {};
        const beforeColor = response.current_primary_color || '#7db87a';
        const afterColor = webDraft.primary_color || beforeColor;

        card = {
          type: 'proposal',
          title: 'Color e identidad de marca',
          summary: assistantReply,
          beforeAfter: [{ label: 'Color principal', before: beforeColor, after: afterColor }],
          riskLevel: 'low',
          action: 'update_branding',
          webDraft,
        };
      } else if (response.intent === 'update_web_content') {
        const webDraft = response.web_draft || {};
        const beforeAfter = [];
        if (webDraft.hero_h1)
          beforeAfter.push({ label: 'Título portada', before: 'Actual', after: webDraft.hero_h1 });
        if (webDraft.hero_subtitle)
          beforeAfter.push({
            label: 'Subtítulo portada',
            before: 'Actual',
            after: webDraft.hero_subtitle,
          });
        if (webDraft.menu_banner_title)
          beforeAfter.push({
            label: 'Banner menú',
            before: 'Actual',
            after: webDraft.menu_banner_title,
          });

        card = {
          type: 'proposal',
          title: 'Contenido de la página web',
          summary: assistantReply,
          beforeAfter: beforeAfter.length
            ? beforeAfter
            : [{ label: 'Textos web', before: 'Actual', after: 'Nuevos textos sugeridos' }],
          riskLevel: 'low',
          action: 'update_web_content',
          webDraft,
        };
      } else if (response.intent === 'batch_stock_entry') {
        const invDraft = response.inventory_draft || {};
        const entries = Array.isArray(invDraft.entries) ? invDraft.entries : [];
        const beforeAfter = entries.map((e) => ({
          label: e.ingredient_name || 'Insumo',
          before: 'Stock actual',
          after: `+${e.quantity_added} ingresadas`,
        }));

        card = {
          type: 'proposal',
          title: 'Registrar entrada de insumos al inventario',
          summary: assistantReply,
          beforeAfter: beforeAfter.length
            ? beforeAfter
            : [{ label: 'Insumos', before: 'Actual', after: 'Ingreso al inventario' }],
          riskLevel: 'medium',
          action: 'batch_stock_entry',
          approveLabel: 'Aprobar e Ingresar a Inventario',
          inventoryDraft: invDraft,
        };
      } else if (response.intent === 'generate_shopping_list') {
        card = {
          type: 'proposal',
          title: 'Lista de compras inteligente (Mercado)',
          summary: assistantReply,
          beforeAfter: [
            {
              label: 'Estado',
              before: 'Monitoreo de stock',
              after: 'Calcular faltantes y generar lista consolidada',
            },
          ],
          riskLevel: 'low',
          action: 'generate_shopping_list',
          inventoryDraft: {},
        };
      } else if (response.intent === 'create_table_batch') {
        const tblDraft = response.table_draft || {};
        const count =
          tblDraft.count ||
          (tblDraft.end_number && tblDraft.start_number
            ? tblDraft.end_number - tblDraft.start_number + 1
            : 5);
        const prefix = tblDraft.prefix !== undefined ? tblDraft.prefix : 'Mesa ';
        const start = tblDraft.start_number || 1;
        const end = tblDraft.end_number || start + count - 1;
        const areaName = tblDraft.area_name ? ` (Área: ${tblDraft.area_name})` : '';

        card = {
          type: 'proposal',
          title: `Crear lote de ${count} mesas y códigos QR${areaName}`,
          summary: assistantReply,
          beforeAfter: [
            {
              label: 'Mesas a crear',
              before: 'Sin crear',
              after: `${count} mesas (${prefix}${start} a ${prefix}${end})`,
            },
            {
              label: 'Área / Salón',
              before: '—',
              after: tblDraft.area_name || 'Salón Principal / General',
            },
            { label: 'Códigos QR', before: 'Inexistentes', after: 'Generación automática con URLs' },
          ],
          riskLevel: 'low',
          action: 'create_table_batch',
          tableDraft: tblDraft,
        };
      } else if (
        response.proposal_ready ||
        [
          'create_catalog',
          'create_costed_product',
          'create_location',
          'update_business_hours',
          'create_payment_method',
          'create_modifier_group',
        ].includes(response.intent)
      ) {
        // Camino 2: Propuesta Agéntica
        const isProduct =
          response.intent === 'create_catalog' || response.intent === 'create_costed_product';
        const draft = response.catalog_draft || {};
        const isDraft =
          isProduct && (!draft.product_name || !draft.price || Number(draft.price) <= 0);

        const rawSuggestedMods =
          Array.isArray(draft.suggested_modifiers) && draft.suggested_modifiers.length > 0
            ? draft.suggested_modifiers
            : draft.category_name?.toLowerCase().includes('bebida') ||
              userMessage.toLowerCase().includes('bebida')
            ? ['Hielo', 'Endulzante']
            : ['Adiciones'];

        const suggestedModifiers = rawSuggestedMods.map((modName) => ({
          name: modName,
          selected: true,
          description: modName.toLowerCase().includes('hielo')
            ? 'Normal, Poco hielo, Sin hielo'
            : modName.toLowerCase().includes('endulzante') ||
              modName.toLowerCase().includes('azucar')
            ? 'Normal, Sin azúcar, Stevia'
            : 'Opciones estándar',
        }));

        const beforeAfter = isProduct
          ? [
              {
                key: 'product_name',
                label: 'Producto',
                fieldLabel: 'Nombre del producto o plato *',
                helper:
                  'El nombre comercial y atractivo que verán los comensales en la carta digital.',
                before: 'No existía',
                after: draft.product_name || '',
                value: draft.product_name || '',
                editable: true,
                placeholder: 'Ej: Limonada de Coco 16oz',
                type: 'text',
              },
              {
                key: 'price',
                label: 'Precio',
                fieldLabel: 'Precio de venta al público (COP) *',
                helper:
                  'Valor final al comensal en pesos colombianos con impuestos incluidos.',
                before: '—',
                after: draft.price ? Number(draft.price) : '',
                value: draft.price ? Number(draft.price) : '',
                editable: true,
                placeholder: 'Ej: 14000',
                type: 'number',
              },
              {
                key: 'category_name',
                label: 'Categoría',
                fieldLabel: 'Categoría en el menú *',
                helper: 'Sección donde se exhibirá este producto en el menú digital.',
                before: '—',
                after:
                  draft.category_name ||
                  (userMessage.toLowerCase().includes('bebida') ? 'Bebidas' : 'General'),
                value:
                  draft.category_name ||
                  (userMessage.toLowerCase().includes('bebida') ? 'Bebidas' : 'General'),
                editable: true,
                placeholder: 'Ej: Bebidas Frías',
                type: 'text',
              },
              {
                key: 'description',
                label: 'Descripción',
                fieldLabel: 'Descripción para el menú QR (opcional)',
                helper:
                  'Frase llamativa que resalte los ingredientes y despierte el apetito del comensal.',
                before: '—',
                after: draft.description || '',
                value: draft.description || '',
                editable: true,
                placeholder:
                  'Ej: Refrescante bebida preparada con frutas frescas y hielo frappé...',
                type: 'text',
              },
            ]
          : [];

        card = {
          type: 'proposal',
          isDraft,
          draftType: isProduct ? 'catalog' : 'general',
          productMode: 'simple',
          suggestedModifiers: isProduct ? suggestedModifiers : [],
          title: isProduct
            ? draft.product_name
              ? `Crear producto: ${draft.product_name}`
              : `Crear nuevo producto en ${draft.category_name || 'Bebidas'}`
            : `Modificación de ${response.intent}`,
          summary: isDraft
            ? 'Completa los campos en el cuadro o respóndele a Aluna para aprobar.'
            : assistantReply,
          beforeAfter,
          riskLevel: isProduct ? 'medium' : 'low',
          action: response.intent,
          draft,
        };
      } else if (response.matched_product && /precio|costo|editar/i.test(userMessage)) {
        // Camino 2: Propuesta de Precio
        card = {
          type: 'proposal',
          title: `Actualizar precio de ${response.matched_product.name}`,
          summary: 'Aluna preparó la actualización de precio para este producto.',
          beforeAfter: [
            {
              label: 'Precio actual',
              before: `$ ${Number(response.matched_product.price || 0).toLocaleString('es-CO')}`,
              after: 'Nuevo precio',
            },
          ],
          riskLevel: 'low',
          action: 'edit_product_price',
          product: response.matched_product,
        };
      } else if (/d[oó]nde|ir a|c[oó]mo llego|atajo|acceso|abr[ir|e]|mu[eé]strame/i.test(lowerUser)) {
        // Camino 3: Deep Link / Atajo Asistido
        const target = detectTargetPage(userMessage + ' ' + assistantReply);
        if (target) {
          card = {
            type: 'deep_link',
            title: `Acceso rápido a ${target}`,
            description: `Haz clic para ir directamente a esta sección del administrador sin navegar por los menús.`,
            targetPage: target,
            prefillData:
              response.catalog_draft && Object.keys(response.catalog_draft).length > 0
                ? response.catalog_draft
                : null,
          };
        }
      } else {
        // Camino 1: Guía Manual (si hay pasos en el texto o si la pregunta es instructiva)
        const steps = parseStepsFromText(assistantReply);
        const target = detectTargetPage(userMessage + ' ' + assistantReply);
        if (steps.length >= 2 || /c[oó]mo|paso|qu[eé] hago/i.test(lowerUser)) {
          card = {
            type: 'guidance',
            title: `Guía paso a paso`,
            steps: steps.length >= 2 ? steps : [assistantReply],
            tip: extractTipFromText(assistantReply),
            targetPage: target,
          };
        }
      }

      setMessages((current) => [...current, { role: 'assistant', content: assistantReply, card }]);
      setSuggestedIntent(response.intent);

      const remoteReplies = Array.isArray(response.suggested_replies)
        ? response.suggested_replies
            .filter((reply) => typeof reply === 'string' && reply.trim())
            .map((reply) => reply.trim())
            .slice(0, 4)
        : [];
      setSuggestedReplies(
        remoteReplies.length
          ? remoteReplies
          : priceReplyFallback(`${userMessage} ${assistantReply}`)
      );
      if (
        ['create_catalog', 'create_costed_product'].includes(response.intent) &&
        response.catalog_draft
      ) {
        setCatalogDraft((current) => ({
          ...current,
          ...response.catalog_draft,
          recipe_draft: response.recipe_draft?.ingredients?.length
            ? response.recipe_draft
            : current.recipe_draft,
        }));
      }
      if (response.matched_product) {
        setSelectedProduct(response.matched_product);
        setCatalogDraft((current) => ({
          ...current,
          ...response.catalog_draft,
          existing_product: response.matched_product,
          recipe_draft: response.recipe_draft,
        }));
      }
      if (
        response.intent === 'create_costed_product' &&
        response.recipe_draft?.ingredients?.length > 0
      ) {
        setSuggestedReplies([]);
        setWorkflow('create_costed_product');
      }
      if (response.intent === 'audit') setAudit(await runOpeningAudit({ brandId, locationId }));
      if (typeof response.current_usage === 'number') setAiUsage(response.current_usage);
    } catch (chatError) {
      setError(chatError.message || 'No pude responder el mensaje.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardSendToChat = (card) => {
    const draft = card.draft || {};
    const name = draft.product_name ? `"${draft.product_name}"` : 'el producto';
    const price = draft.price ? ` a $${Number(draft.price).toLocaleString('es-CO')}` : '';
    const cat = draft.category_name ? ` en la categoría ${draft.category_name}` : '';
    const mode = card.productMode === 'recipe' ? 'con receta e inventario' : 'simple sin receta';
    const text = `Quiero crear ${name}${price}${cat}, como producto ${mode}.`;
    sendMessage(text);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(prompt);
  };

  const handlePromptKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (prompt.trim() && !isLoading) sendMessage(prompt);
    }
  };

  const handleSuggestedReply = (reply) => {
    const normalized = reply.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (
      /aprobar|confirmar|revisar.*creacion/.test(normalized) &&
      ['create_catalog', 'create_costed_product'].includes(suggestedIntent)
    ) {
      setSuggestedReplies([]);
      setWorkflow(suggestedIntent);
      return;
    }
    if (/ver.*catalogo/.test(normalized) && onNavigate) {
      setIsOpen(false);
      onNavigate('products');
      return;
    }
    if (/crear.*nuevo.*producto/.test(normalized)) {
      setCatalogDraft({});
      setSuggestedReplies([]);
      setWorkflow(recipesEnabled ? 'create_costed_product' : 'create_catalog');
      return;
    }
    if (selectedProduct && /definir|listar.*ingredientes|editar.*ingredientes/.test(normalized)) {
      setSuggestedReplies([]);
      setWorkflow('create_costed_product');
      return;
    }
    if (/horario/.test(normalized)) {
      setSuggestedReplies([]);
      setWorkflow('update_business_hours');
      return;
    }
    sendMessage(reply);
  };

  const resolveFinding = (finding) => {
    if (finding.key === 'locations') {
      setWorkflow('create_location');
      return;
    }
    if (finding.key === 'catalog') {
      setWorkflow('create_catalog');
      return;
    }
    if (finding.key === 'business_hours') {
      setWorkflow('update_business_hours');
      return;
    }
    if (finding.key === 'payment_methods') {
      setWorkflow('create_payment_method');
      return;
    }
    if (finding.key === 'printing') {
      setWorkflow('update_printing_settings');
      return;
    }
    if (finding.key === 'modifiers') {
      setWorkflow('create_modifier_group');
      return;
    }
    const page = FINDING_PAGES[finding.key];
    if (page && onNavigate) {
      setIsOpen(false);
      onNavigate(page);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isLoading,
    audit,
    error,
    prompt,
    setPrompt,
    workflow,
    setWorkflow,
    success,
    messages,
    suggestedIntent,
    suggestedReplies,
    catalogDraft,
    availableCategories,
    changes,
    selectedProduct,
    aiUsage,
    isExpanded,
    setIsExpanded,
    promptRef,
    titleId,
    brandId,
    brandName,
    locationName,
    planQuota,
    executeAudit,
    loadChanges,
    openChanges,
    handleDeepNavigate,
    handleDeepPrefill,
    handleApproveProposalCard,
    handleDismissCard,
    handleCardFieldChange,
    handleCardProductModeChange,
    handleCardToggleModifier,
    handleCardSendToChat,
    sendMessage,
    handleSubmit,
    handlePromptKeyDown,
    handleSuggestedReply,
    approveLocation,
    approveCatalog,
    approveConsolidation,
    approveCostedProduct,
    approvePrice,
    approveOperations,
    approveBrandWeb,
    approveInventory,
    approveVenue,
    resolveFinding,
  };
}
