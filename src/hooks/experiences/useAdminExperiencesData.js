import { useState, useEffect } from 'react';
import { useExperiences } from '../useExperiences';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { validateImageSize, compressAndWebp } from '../../utils/images';
import { toast as toastFn } from '../../components/Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2500 }),
  error: (msg) => toastFn(msg, { duration: 3500 }),
};

export const TYPE_LABELS = {
  private: { label: 'Reserva Privada / A Domicilio', icon: 'heroicons:user-group', color: 'text-amber-700 bg-amber-100 border border-amber-200' },
  omakase: { label: 'Omakase Romántico (Cena Privada)', icon: 'heroicons:star', color: 'text-rose-700 bg-rose-100 border border-rose-200' },
  catering: { label: 'Catering en Vivo (3 Estaciones)', icon: 'heroicons:fire', color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' },
  workshop: { label: 'Taller / Masterclass', icon: 'heroicons:wrench-screwdriver', color: 'text-blue-600 bg-blue-50' },
  event: { label: 'Evento Programado', icon: 'heroicons:sparkles', color: 'text-purple-600 bg-purple-50' },
  tasting: { label: 'Cata', icon: 'heroicons:beaker', color: 'text-amber-600 bg-amber-50' },
  tour: { label: 'Tour', icon: 'heroicons:map', color: 'text-emerald-600 bg-emerald-50' },
  dinner: { label: 'Cena Temática', icon: 'heroicons:fire', color: 'text-red-600 bg-red-50' },
  premium: { label: 'Premium', icon: 'heroicons:star', color: 'text-yellow-600 bg-yellow-50' },
};

export const EMPTY_FORM = {
  title: '',
  short_description: '',
  description: '',
  type: 'private',
  price: '',
  capacity: 10,
  duration_minutes: 180,
  image_url: '',
  includes: [],
  location: 'A domicilio / Espacio del cliente',
  is_active: true,
  dates: [],
  is_private_booking: true,
  steps: []
};

export const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v || 0);

export function useAdminExperiencesData() {
  const { isFeatureLocked } = useAuth();
  const {
    experiences,
    loading,
    createExperience,
    updateExperience,
    deleteExperience,
    toggleActive,
    fetchBookings,
    fetchAllBookings,
    updateBooking,
  } = useExperiences();

  const isLocked = isFeatureLocked('experiences');

  const [activeTab, setActiveTab] = useState('experiencias'); // 'experiencias' | 'leads'
  const [allLeads, setAllLeads] = useState([]);
  const [loadingAllLeads, setLoadingAllLeads] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [includeInput, setIncludeInput] = useState('');
  const [stepInput, setStepInput] = useState({ title: '', description: '' });
  const [uploadingExpImage, setUploadingExpImage] = useState(false);
  const [dateInput, setDateInput] = useState({ date: '', start_time: '', end_time: '' });

  // Bookings drawer
  const [selectedExpId, setSelectedExpId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (activeTab === 'leads') {
      loadAllLeads();
    }
  }, [activeTab]);

  const loadAllLeads = async () => {
    setLoadingAllLeads(true);
    const { data } = await fetchAllBookings();
    setAllLeads(data || []);
    setLoadingAllLeads(false);
  };

  const openModal = (exp = null) => {
    if (exp) {
      const isPrivate =
        exp.is_private_booking !== undefined
          ? exp.is_private_booking
          : ['private', 'omakase', 'catering'].includes(exp.type) || !exp.dates || exp.dates.length === 0;

      const parsedSteps = exp.steps && exp.steps.length > 0 ? exp.steps : [];
      const parsedIncludes = [];

      (exp.includes || []).forEach((inc) => {
        if (typeof inc === 'string' && inc.toLowerCase().startsWith('paso ')) {
          if (!exp.steps || exp.steps.length === 0) {
            const parts = inc.split(': ');
            const title = parts[0] ? parts[0].trim() : inc;
            const description = parts.slice(1).join(': ').trim();
            parsedSteps.push({ title, description });
          }
        } else {
          parsedIncludes.push(inc);
        }
      });

      setEditingExp(exp);
      setForm({
        title: exp.title || '',
        short_description: exp.short_description || '',
        description: exp.description || '',
        type: exp.type || 'private',
        price: exp.price || '',
        capacity: exp.capacity || 10,
        duration_minutes: exp.duration_minutes || 180,
        image_url: exp.image_url || '',
        includes: parsedIncludes,
        location: exp.location || '',
        is_active: exp.is_active !== false,
        dates: exp.dates || [],
        is_private_booking: isPrivate,
        steps: parsedSteps,
      });
    } else {
      setEditingExp(null);
      setForm(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addStep = () => {
    if (stepInput.title.trim()) {
      setForm((f) => ({
        ...f,
        steps: [...(f.steps || []), { title: stepInput.title.trim(), description: stepInput.description.trim() }],
      }));
      setStepInput({ title: '', description: '' });
    }
  };

  const removeStep = (idx) => {
    setForm((f) => ({ ...f, steps: (f.steps || []).filter((_, i) => i !== idx) }));
  };

  const handleExpImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageSize(file, toast)) return;

    setUploadingExpImage(true);
    try {
      const compressedFile = await compressAndWebp(file, { maxWidthOrHeight: 1200, maxSizeMB: 0.3 });
      const fileName = `experience_${Date.now()}.webp`;
      const filePath = `experiences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: publicData.publicUrl }));
      toast.success('Imagen subida y optimizada en formato WebP');
    } catch (error) {
      console.error('Error subiendo imagen de experiencia:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingExpImage(false);
    }
  };

  const addInclude = () => {
    if (includeInput.trim()) {
      setForm((f) => ({ ...f, includes: [...f.includes, includeInput.trim()] }));
      setIncludeInput('');
    }
  };

  const removeInclude = (idx) => {
    setForm((f) => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));
  };

  const addDate = () => {
    if (dateInput.date && dateInput.start_time && dateInput.end_time) {
      setForm((f) => ({
        ...f,
        dates: [...f.dates, { ...dateInput, spots_left: f.capacity }],
      }));
      setDateInput({ date: '', start_time: '', end_time: '' });
    }
  };

  const removeDate = (idx) => {
    setForm((f) => ({ ...f, dates: f.dates.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formattedSteps = (form.steps || []).map((s, idx) => {
      const stepPrefix = s.title.toLowerCase().startsWith('paso') ? '' : `Paso ${idx + 1}: `;
      return s.description ? `${stepPrefix}${s.title}: ${s.description}` : `${stepPrefix}${s.title}`;
    });

    const baseIncludes = (form.includes || []).filter(
      (inc) => typeof inc === 'string' && !inc.toLowerCase().startsWith('paso ')
    );
    const mergedIncludes = [...baseIncludes, ...formattedSteps];

    const DB_TYPE_MAP = {
      private: 'premium',
      omakase: 'dinner',
      catering: 'event',
      workshop: 'workshop',
      event: 'event',
      tasting: 'tasting',
      tour: 'tour',
      dinner: 'dinner',
      premium: 'premium',
    };

    const validDbType = DB_TYPE_MAP[form.type] || 'premium';

    const payload = {
      title: form.title,
      short_description: form.short_description || '',
      description: form.description || '',
      type: validDbType,
      price: Number(form.price) || 0,
      capacity: Number(form.capacity) || 10,
      duration_minutes: Number(form.duration_minutes) || 60,
      image_url: form.image_url || '',
      includes: mergedIncludes,
      location: form.location || '',
      is_active: form.is_active !== false,
      dates: form.dates || [],
    };

    let result;
    if (editingExp) {
      result = await updateExperience(editingExp.id, payload);
    } else {
      result = await createExperience(payload);
    }
    setSaving(false);
    if (!result?.error) {
      toast.success(editingExp ? 'Experiencia actualizada' : 'Experiencia guardada con éxito');
      setIsModalOpen(false);
    } else {
      console.error('Error saving experience:', result.error);
      toast.error('Error al guardar la experiencia: ' + (result.error.message || 'Verifica los campos'));
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`¿Eliminar "${title}"? Se borrarán también las reservas.`)) {
      await deleteExperience(id);
    }
  };

  const openBookings = async (expId) => {
    setSelectedExpId(expId);
    setLoadingBookings(true);
    const { data } = await fetchBookings(expId);
    setBookings(data || []);
    setLoadingBookings(false);
  };

  const closeBookings = () => {
    setSelectedExpId(null);
  };

  const togglePaymentStatus = async (bookingId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await updateBooking(bookingId, { payment_status: newStatus });
    if (activeTab === 'leads') {
      setAllLeads((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, payment_status: newStatus } : b))
      );
    }
    if (selectedExpId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, payment_status: newStatus } : b))
      );
    }
  };

  return {
    isLocked,
    loading,
    experiences,
    activeTab,
    setActiveTab,
    allLeads,
    loadingAllLeads,
    isModalOpen,
    editingExp,
    form,
    setForm,
    saving,
    includeInput,
    setIncludeInput,
    stepInput,
    setStepInput,
    uploadingExpImage,
    dateInput,
    setDateInput,
    selectedExpId,
    bookings,
    loadingBookings,
    openModal,
    closeModal,
    addStep,
    removeStep,
    handleExpImageUpload,
    addInclude,
    removeInclude,
    addDate,
    removeDate,
    handleSubmit,
    handleDelete,
    openBookings,
    closeBookings,
    togglePaymentStatus,
    toggleActive,
  };
}
