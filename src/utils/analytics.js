import { supabase } from "@/config/supabase";

const SESSION_KEY = "aluna_session_id";

const getOrCreateSessionId = () => {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return null;
  }
};

const getStoredLocationId = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("loc") ||
      params.get("location_id") ||
      sessionStorage.getItem("aa_current_location_id") ||
      null
    );
  } catch {
    return null;
  }
};

export const trackAnalyticsEvent = async (eventName, metadata = {}) => {
  const {
    brandId = null,
    locationId = null,
    tableId = null,
    ...safeMetadata
  } = metadata;

  // CRITICAL: Ensure we have a brandId, otherwise RLS will fail
  if (!brandId) {
    console.debug("[Analytics] Skipping event: Missing brandId", eventName);
    return;
  }

  try {
    const sessionId = getOrCreateSessionId();
    const finalLocationId = locationId || getStoredLocationId();

    const { error } = await supabase.from("analytics_events").insert([
      {
        event_name: eventName,
        session_id: sessionId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        metadata: safeMetadata,
        table_id: tableId,
        brand_id: brandId,
        location_id: finalLocationId,
      },
    ]);

    if (error) {
      // If it's an RLS error, it's likely a configuration issue on the DB side
      if (error.code === '42501') {
        console.error(`[Analytics] RLS Violation for event "${eventName}". 
          Ensure table "analytics_events" has public INSERT policy.
          Current Project: ${import.meta.env.VITE_SUPABASE_URL}`);
      } else {
        console.warn(`[Analytics] Error tracking "${eventName}":`, error.message);
      }
    }
  } catch (err) {
    console.error("[Analytics] Fatal error:", err);
  }
};
