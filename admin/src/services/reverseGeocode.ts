/**
 * Reverse geocoding utility using Google Maps API
 * Converts coordinates to address
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('VITE_GOOGLE_MAPS_API_KEY not configured in .env');
}

export interface AddressComponent {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formattedAddress?: string;
}

/**
 * Reverse geocode coordinates to get address
 * Returns null if request fails
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<AddressComponent | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ VITE_GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    console.log(`📍 Reverse geocoding: ${latitude}, ${longitude}`);

    // Use Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      console.error('❌ Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('❌ Geocoding status:', data.status, data.error_message || '');
      return null;
    }

    if (data.results.length === 0) {
      console.warn('⚠️ No geocoding results found');
      return null;
    }

    const result = data.results[0];
    const addressObj: AddressComponent = {
      formattedAddress: result.formatted_address,
    };

    // Parse address components
    result.address_components?.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes('street_number') || types.includes('route')) {
        addressObj.street = (addressObj.street || '') + ' ' + component.long_name;
      }
      if (types.includes('locality')) {
        addressObj.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        addressObj.state = component.long_name;
      }
      if (types.includes('postal_code')) {
        addressObj.zipCode = component.long_name;
      }
      if (types.includes('country')) {
        addressObj.country = component.long_name;
      }
    });

    console.log('✓ Geocoding successful:', addressObj.formattedAddress);
    return addressObj;
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Format address components into a single string
 */
export const formatAddress = (address: AddressComponent): string => {
  if (address.formattedAddress) {
    return address.formattedAddress;
  }
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zipCode) parts.push(address.zipCode);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
};
