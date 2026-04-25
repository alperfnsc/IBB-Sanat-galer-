import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Clock, ArrowLeft, Loader2, Navigation, Map as MapIcon, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchGalleries, Gallery } from '../services/dataService';
import { geocodeAddress, Coordinates } from '../services/geocodeService';
import L from 'leaflet';

// Create a static, modern museum (landmark) icon marker using divIcon
const getCustomIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative w-9 h-9 flex items-center justify-center bg-neutral-900 border-2 border-white text-white rounded-full shadow-lg hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="22" x2="21" y2="22"></line>
          <line x1="6" y1="18" x2="6" y2="11"></line>
          <line x1="10" y1="18" x2="10" y2="11"></line>
          <line x1="14" y1="18" x2="14" y2="11"></line>
          <line x1="18" y1="18" x2="18" y2="11"></line>
          <polygon points="12 2 20 7 4 7"></polygon>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    tooltipAnchor: [18, 0]
  });
};

type LoadedGallery = Gallery & { coords: Coordinates | null };

export default function MapPage() {
  const [galleries, setGalleries] = useState<LoadedGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Center of Istanbul
  const istanbulCenter: [number, number] = [41.0082, 28.9784];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchGalleries();
        
        // Initial setup with empty coords
        setGalleries(data.map(g => ({ ...g, coords: null })));
        setLoading(false);

        // Async geocoding for all coordinates (progressively populates)
        data.forEach(async (gallery) => {
          const coords = await geocodeAddress(gallery.address, gallery.district, gallery.name);
          if (coords) {
            setGalleries(prev => 
              prev.map(item => 
                item.name === gallery.name ? { ...item, coords } : item
              )
            );
          }
        });
      } catch (err) {
        console.error(err);
        setError("Galeri verileri yüklenirken bir sorun oluştu.");
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalLoaded = galleries.filter(g => g.coords !== null).length;

  return (
    <div className="h-screen w-full flex flex-col bg-neutral-50 relative">
      <header className="flex-none h-16 bg-white border-b border-neutral-200 shadow-sm z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-black" />
          </Link>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-neutral-900" />
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight hidden sm:block">
              İstanbul Sanat Galerileri
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalLoaded < galleries.length && !error ? (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Harita noktaları yükleniyor... ({totalLoaded}/{galleries.length})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span>{totalLoaded} Galeri Yüklendi</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-0">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-neutral-900 mb-4" />
            <p className="text-neutral-600 font-medium">Veriler getiriliyor, lütfen bekleyin...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
            <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* The Map */}
        <MapContainer 
          center={istanbulCenter} 
          zoom={12} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ZoomControl position="bottomright" />
          
          {galleries.filter(g => g.coords !== null).map((gallery, idx) => (
            <Marker 
              key={`${gallery.name}-${idx}`} 
              position={[gallery.coords!.lat, gallery.coords!.lng]}
              icon={getCustomIcon()}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                className="custom-tooltip font-sans rounded-md shadow-sm border border-neutral-200"
              >
                <div className="font-semibold text-neutral-900">{gallery.name}</div>
                <div className="text-xs text-neutral-500">{gallery.district}</div>
              </Tooltip>
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[200px] max-w-[280px] p-1 font-sans">
                  {gallery.image && (
                    <div className="w-full h-32 overflow-hidden rounded-t-lg -mt-1 -mx-1 mb-2">
                      <img 
                        src={gallery.image} 
                        alt={gallery.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <h3 className="text-base font-bold text-neutral-900 leading-tight border-b border-neutral-100 pb-2">
                    {gallery.name}
                  </h3>
                  
                  <div className="flex items-start gap-2 text-sm text-neutral-700 mt-1">
                    <Navigation className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                    <span>{gallery.address}</span>
                  </div>
                  
                  {gallery.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                      <a href={`tel:${gallery.phone}`} className="hover:text-black font-medium transition-colors">
                        {gallery.phone}
                      </a>
                    </div>
                  )}

                  {gallery.workingHours && (
                    <div className="flex items-start gap-2 text-sm text-neutral-700">
                      <Clock className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                      <span>{gallery.workingHours}</span>
                    </div>
                  )}
                  
                  {/* Provide navigation link on google maps */}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${gallery.coords!.lat},${gallery.coords!.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <MapIcon className="w-4 h-4" />
                    <span>Yol Tarifi Al</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}