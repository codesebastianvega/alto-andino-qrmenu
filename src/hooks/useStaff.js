import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setStaffList(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createStaff(staffData) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([staffData])
        .select()
        .single();
      
      if (error) throw error;
      setStaffList(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function updateStaff(id, updates) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setStaffList(prev => prev.map(s => s.id === id ? data : s));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function deleteStaff(id) {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setStaffList(prev => prev.filter(s => s.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  return {
    staffList,
    loading,
    error,
    refresh: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
}
