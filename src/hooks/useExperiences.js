import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export function useExperiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setExperiences(data || []);
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

  const createExperience = async (experienceData) => {
    const { data, error } = await supabase
      .from('experiences')
      .insert([experienceData])
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
      .select()
      .single();
    if (!error) setExperiences(prev => prev.map(e => e.id === id ? data : e));
    return { data, error };
  };

  const deleteExperience = async (id) => {
    const { error } = await supabase.from('experiences').delete().eq('id', id);
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

  const createBooking = async (bookingData) => {
    const { data, error } = await supabase
      .from('experience_bookings')
      .insert([bookingData])
      .select()
      .single();
    return { data, error };
  };

  const updateBookingStatus = async (id, status) => {
    const { data, error } = await supabase
      .from('experience_bookings')
      .update({ status })
      .eq('id', id)
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
    createBooking,
    updateBookingStatus,
  };
}
