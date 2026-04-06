import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useExperiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('experiences')
      .select('*');

    if (activeBrandId) {
      query = query.eq('brand_id', activeBrandId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });
    if (!error) setExperiences(data || []);
    setLoading(false);
    return { data, error };
  }, [activeBrandId]);

  useEffect(() => { 
    if (activeBrandId) {
      fetchExperiences(); 
    } else {
      setLoading(false);
    }
  }, [activeBrandId, fetchExperiences]);

  const createExperience = async (experienceData) => {
    const { data, error } = await supabase
      .from('experiences')
      .insert([{ ...experienceData, brand_id: activeBrandId }])
      .select()
      .single();
    if (!error) setExperiences(prev => [data, ...prev]);
    return { data, error };
  };

  const updateExperience = async (id, updates) => {
    const { data, error } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', id)
      .eq('brand_id', activeBrandId)
      .select()
      .single();
    if (!error) setExperiences(prev => prev.map(e => e.id === id ? data : e));
    return { data, error };
  };

  const deleteExperience = async (id) => {
    const { error } = await supabase.from('experiences').delete().eq('id', id).eq('brand_id', activeBrandId);
    if (!error) setExperiences(prev => prev.filter(e => e.id !== id));
    return { error };
  };

  const toggleActive = async (id, currentState) => {
    return updateExperience(id, { is_active: !currentState });
  };

  // --- Bookings ---
  const fetchBookings = async (experienceId) => {
    const { data, error } = await supabase
      .from('experience_bookings')
      .select('*')
      .eq('experience_id', experienceId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  };

  const fetchAllBookings = async () => {
    let query = supabase
      .from('experience_bookings')
      .select(`
        *,
        experiences:experience_id(title)
      `);

    if (activeBrandId) {
      query = query.eq('brand_id', activeBrandId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  };

  const createBooking = async (bookingData) => {
    const { data, error } = await supabase
      .from('experience_bookings')
      .insert([{ ...bookingData, brand_id: activeBrandId }])
      .select()
      .single();
    return { data, error };
  };

  const updateBooking = async (id, updates) => {
    const { data, error } = await supabase
      .from('experience_bookings')
      .update(updates)
      .eq('id', id)
      .eq('brand_id', activeBrandId)
      .select()
      .single();
    return { data, error };
  };

  return {
    experiences,
    loading,
    fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
    toggleActive,
    fetchBookings,
    fetchAllBookings,
    createBooking,
    updateBooking,
  };
}
