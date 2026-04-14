/**
 * Date Parser Utility - IST-safe date handling
 * 
 * Fixes timezone bug where "2026-08-15" was being stored as "2026-08-14"
 * because new Date("2026-08-15") parses as UTC, not local time.
 * 
 * For IST (UTC+5:30): UTC midnight becomes 7:30 PM previous day
 */

/**
 * Parse YYYY-MM-DD string as local date (NOT UTC)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} - Date at midnight in local timezone
 */
function parseLocalDate(dateString) {
  if (!dateString) return null;
  
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;
  
  // Create date using local timezone, not UTC
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Parse date range (both start and end dates as local dates)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} - { startDate, endDate } as Date objects
 */
function parseLocalDateRange(startDate, endDate) {
  return {
    startDate: parseLocalDate(startDate),
    endDate: parseLocalDate(endDate),
  };
}

module.exports = {
  parseLocalDate,
  parseLocalDateRange,
};
