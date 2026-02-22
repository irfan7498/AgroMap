// Replace with your machine's local IP if testing on a physical device
export const BASE_URL = 'http://192.168.1.100:8000/api/v1';

export const API = {
    crops: `${BASE_URL}/crops`,
    nurseries: (lat: number, lng: number, radius = 50, crop?: string) => {
        let url = `${BASE_URL}/nurseries/nearby?lat=${lat}&lng=${lng}&radius_km=${radius}`;
        if (crop) url += `&crop=${crop}`;
        return url;
    },
    plantationEstimate: `${BASE_URL}/plantation/estimate`,
    plantationLayout: `${BASE_URL}/plantation/layout`,
    weather: (lat: number, lng: number) => `${BASE_URL}/weather?lat=${lat}&lng=${lng}`,
    water: `${BASE_URL}/water/calculate`,
    bookings: `${BASE_URL}/bookings`,
    bookingDetail: (id: string) => `${BASE_URL}/bookings/${id}`,
};
