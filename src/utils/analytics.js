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

  if (!brandId) return;

  try {
    const sessionId = getOrCreateSessionId();

    const { error } = await supabase.from("analytics_events").insert([
      {
        event_name: eventName,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        metadata: safeMetadata,
        table_id: tableId,
        brand_id: brandId,
        location_id: locationId || getStoredLocationId(),
      },
    ]);

    if (error) {
      console.warn("Analytics tracking skipped:", error.message || error);
    }
  } catch (error) {
    console.warn("Analytics tracking failed:", error);
  }
};
