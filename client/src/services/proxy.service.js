import { apiFetch } from './api.js'


// Unsplash image search — API key stays on the server, never sent to the client
export const searchUnsplash = (query) =>
	apiFetch(`/api/proxy/unsplash/search?q=${encodeURIComponent(query)}`)

// Open-Meteo weather for a given coordinate + date
// date: 'YYYY-MM-DD'
export const getWeather = (lat, lng, date) =>
	apiFetch(`/api/proxy/weather?lat=${lat}&lng=${lng}&date=${date}`)

// Nominatim place-name geocoding — returns up to 5 results with lat/lng
export const geocodePlace = (query) =>
	apiFetch(`/api/proxy/geocode?q=${encodeURIComponent(query)}`)
