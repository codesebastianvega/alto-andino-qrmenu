import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateText = useCallback(async ({ brandId, prompt, actionType }) => {
    setLoading(true);
    setError(null);

    try {
      // Llamar a la Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('generate-ai-text', {
        body: { 
          brand_id: brandId, 
          prompt: prompt,
          action_type: actionType
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.text;
    } catch (err) {
      console.error('Error in useGemini hook:', err);
      setError(err.message || 'Error al conectar con la IA de Aluna');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateText, loading, error };
};
