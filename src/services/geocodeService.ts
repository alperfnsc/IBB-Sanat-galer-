export type Coordinates = { lat: number; lng: number };

const CACHE_KEY = 'geocode_cache_v3';
const DELAY_MS = 1100;

// Hardcoded prominent locations that OSM struggles with or places with complex addresses
const KNOWN_LOCATIONS: Record<string, Coordinates> = {
  "Çırağan Palace Kempinski Sanat Galerisi": { lat: 41.0428, lng: 29.0175 },
  "İş Sanat İş Kuleleri Salonu (Kibele Sanat Galerisi)": { lat: 41.0827, lng: 29.0108 },
  "Yapı Kredi Kültür Sanat": { lat: 41.0315, lng: 28.9765 },
  "Pera Müzesi": { lat: 41.0316, lng: 28.9751 },
  "Arter": { lat: 41.0427, lng: 28.9772 },
  "Salt Galata": { lat: 41.0240, lng: 28.9741 },
  "Dirimart": { lat: 41.0305, lng: 28.9738 },
  "Mixer Arts": { lat: 41.0245, lng: 28.9778 },
  "Sanatorium": { lat: 41.0232, lng: 28.9745 },
  "İstanbul Fuar Merkezi": { lat: 40.9884, lng: 28.8267 },
  "CNR Expo": { lat: 40.9884, lng: 28.8267 },
  "Doruk Sanat Galerisi": { lat: 41.0608, lng: 28.9715 }, // Perpa
  "Almelek Sanat Galerisi": { lat: 41.0772, lng: 29.0435 }, // Bebek
  "Galeri Artist Istanbul": { lat: 41.0322, lng: 28.9880 }, // Fındıklı
  "Amerikan Hastanesi Sanat Galerisi (Operation Room)": { lat: 41.0535, lng: 28.9954 } // Nişantaşı
};

export function getCache(): Record<string, Coordinates> {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function setCache(cache: Record<string, Coordinates>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Could not write to localStorage", e);
  }
}

// Helper to make nominatim request
async function fetchNominatim(queryStr: string): Promise<Coordinates | null> {
  try {
    // viewbox limits strictly to Istanbul's bounding box
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1&accept-language=tr&countrycodes=tr&viewbox=28.4,41.3,29.9,40.7&bounded=1&email=app@example.com`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn("Nominatim fetch error", e);
  }
  return null;
}

const queue: { name: string, address: string; fallbackDistrict?: string; resolve: (coord: Coordinates | null) => void }[] = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;

    const { name, address, fallbackDistrict, resolve } = item;
    
    // Check known locations first
    if (KNOWN_LOCATIONS[name]) {
      resolve(KNOWN_LOCATIONS[name]);
      continue;
    }

    const cache = getCache();
    // Prefer caching by specific name rather than just address, since addresses repeat or get mangled
    const cacheKey = `${name}_${address}`;
    if (cache[cacheKey]) {
      resolve(cache[cacheKey]);
      continue;
    }

    let coords = null;

    // Pass 1: Try Cleaned Address + District
    // Remove "No: X", "Kat: X", "Apt", "Blok", etc. which confuses Nominatim
    const cleanedAddress = address
      .replace(/No:\s*[A-Z0-9\/\-]+/gi, '')
      .replace(/Kat:\s*[0-9A-Z]+/gi, '')
      .replace(/D:\s*[0-9]+/gi, '')
      .replace(/[0-9A-Z]+\s*Blok/gi, '')
      .replace(/Apt\.?/gi, '')
      .replace(/,\s*34[0-9]{3}/g, '') // remove zip codes
      .trim();
    
    coords = await fetchNominatim(`${cleanedAddress}, ${fallbackDistrict || ''}, Istanbul`);

    // Pass 2: Try Just Name + District
    if (!coords) {
      await new Promise(r => setTimeout(r, DELAY_MS));
      coords = await fetchNominatim(`${name}, ${fallbackDistrict || ''}, Istanbul`);
    }

    // Pass 3: Fallback District with Jitter
    if (!coords && fallbackDistrict) {
      await new Promise(r => setTimeout(r, DELAY_MS));
      coords = await fetchNominatim(`${fallbackDistrict}, Istanbul`);
      if (coords) {
        // Scatter slightly so they don't overlap entirely at the district center
        coords.lat += (Math.random() - 0.5) * 0.005;
        coords.lng += (Math.random() - 0.5) * 0.005;
      }
    }

    if (coords) {
      cache[cacheKey] = coords;
      setCache(cache);
    }
    
    resolve(coords);

    // Rate limit
    if (queue.length > 0) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  isProcessing = false;
}

export function geocodeAddress(address: string, fallbackDistrict?: string, name: string = ""): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    const cacheKey = `${name}_${address}`;
    if (KNOWN_LOCATIONS[name]) {
       resolve(KNOWN_LOCATIONS[name]);
       return;
    }
    const cache = getCache();
    if (cache[cacheKey]) {
      resolve(cache[cacheKey]);
      return;
    }
    
    queue.push({ name, address, fallbackDistrict, resolve });
    processQueue();
  });
}
