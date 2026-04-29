import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';

export function useStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id;

  useEffect(() => {
    if (activeBrandId) {
      fetchStaff();
    } else {
      setLoading(false);
    }
  }, [activeBrandId, activeLocationId, isAllLocations]);

  async function fetchStaff() {
    try {
      setLoading(true);
      let query = supabase
        .from('staff')
        .select('*');

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      if (!isAllLocations && activeLocationId) {
        // Staff that has access to all locations OR has this specific location in their list
        query = query.or(`access_all_locations.eq.true,location_ids.cs.{"${activeLocationId}"}`);
      }

      const { data, error: fetchError } = await query
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
        .insert([{ ...staffData, brand_id: activeBrandId }])
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
        .eq('brand_id', activeBrandId)
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
        .eq('id', id)
        .eq('brand_id', activeBrandId);
      
      if (error) throw error;
      setStaffList(prev => prev.filter(s => s.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  // --- Shift Management ---

  async function getActiveShift(staffId) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('staff_id', staffId)
        .is('clock_out', null)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function clockIn(staffId, locationId) {
    try {
      // Check if already has an active shift
      const { data: activeShift } = await getActiveShift(staffId);
      if (activeShift) return { data: activeShift, error: null };

      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          staff_id: staffId,
          location_id: locationId,
          brand_id: activeBrandId,
          clock_in: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function clockOut(staffId) {
    try {
      const { data: activeShift } = await getActiveShift(staffId);
      if (!activeShift) return { error: 'No active shift found' };

      const clockOutTime = new Date();
      const clockInTime = new Date(activeShift.clock_in);
      const totalMinutes = Math.round((clockOutTime - clockInTime) / 60000);

      const { data, error } = await supabase
        .from('shifts')
        .update({
          clock_out: clockOutTime.toISOString(),
          total_minutes: totalMinutes,
          is_active: false
        })
        .eq('id', activeShift.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
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
    deleteStaff,
    clockIn,
    clockOut,
    getActiveShift
  };
}

