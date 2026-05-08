/**
 * Checks if the restaurant is currently open based on the business hours settings.
 * 
 * @param {Array} businessHours - Array of business hour objects from the database.
 * @returns {Object} - { isOpen: boolean, message: string }
 */
export function isRestaurantOpen(businessHours) {
  if (!businessHours || businessHours.length === 0) {
    // If no hours are defined, assume open but log warning
    console.warn("No business hours defined. Assuming open.");
    return { isOpen: true, message: "" };
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // Find the settings for today
  const todayHours = businessHours.find(h => h.day_of_week === dayOfWeek);

  if (!todayHours) {
    return { isOpen: true, message: "" }; // Fallback if day not found
  }

  if (todayHours.is_closed) {
    return { isOpen: false, message: "Lo sentimos, hoy estamos cerrados." };
  }

  const [openH, openM] = (todayHours.open_time || "00:00").split(':').map(Number);
  const [closeH, closeM] = (todayHours.close_time || "23:59").split(':').map(Number);

  const openTimeValue = openH * 100 + openM;
  const closeTimeValue = closeH * 100 + closeM;

  // Handle shifts that cross midnight (e.g. 18:00 to 02:00)
  if (closeTimeValue < openTimeValue) {
    // If current time is after opening OR before closing (next day)
    if (currentTime >= openTimeValue || currentTime < closeTimeValue) {
      return { isOpen: true, message: "" };
    }
  } else {
    // Normal shift
    if (currentTime >= openTimeValue && currentTime < closeTimeValue) {
      return { isOpen: true, message: "" };
    }
  }

  return { 
    isOpen: false, 
    message: `Estamos cerrados. Abrimos hoy de ${todayHours.open_time} a ${todayHours.close_time}.` 
  };
}
