import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, Search, Info, MapPin, Crosshair, Navigation, Check, Sparkles, Loader, X } from 'lucide-react';
import { Event, User, Coordinates } from '../types';
import EventCard from './components/EventCard';
import { MOCK_PLACES_DB, MockPlace } from '../services/mockData';

declare var google: any;

function getDistanceFromLatLonInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 3958.8; 
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg: number) { return deg * (Math.PI/180); }

interface MarketplaceProps {
  events: Event[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onEventClick: (event: Event) => void;
  user: User;
}

const Marketplace: React.FC<MarketplaceProps> = ({ events, bookmarks, onToggleBookmark, onEventClick, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOpenShootsOnly, setShowOpenShootsOnly] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [radiusInput, setRadiusInput] = useState<number>(50);
  const [activeLocation, setActiveLocation] = useState<{ coords: Coordinates; label: string; radius: number; } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && autocompleteInputRef.current) {
        try {
            const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
                fields: ["formatted_address", "geometry", "name"],
                types: ["geocode", "establishment"]
            });
            
            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) {
                    setLocationError("Please select a location from the suggestions.");
                    return;
                }
                const coords = { 
                    lat: place.geometry.location.lat(), 
                    lng: place.geometry.location.lng() 
                };
                const label = place.formatted_address || place.name;
                setLocationQuery(label);
                setActiveLocation({ coords, label, radius: radiusInput });
                setLocationError(null);
            });

            autocompleteRef.current = autocomplete;
            setGoogleApiLoaded(true);
        } catch (e) {
            console.error("Autocomplete init error:", e);
            setGoogleApiLoaded(false);
        }
    }
  }, [radiusInput]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { 
        setLocationError("Browser geolocation disabled."); 
        return; 
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setActiveLocation({ coords, label: "Your Vicinity", radius: radiusInput });
        setLocationQuery("Your Vicinity");
        setIsLocating(false);
        setLocationError(null);
      },
      () => { 
        setLocationError("Location fetch failed."); 
        setIsLocating(false); 
      }
    );
  };

  const handleManualSearch = () => {
    if (!locationQuery.trim()) { 
        setActiveLocation(null); 
        return; 
    }
    if (activeLocation && locationQuery === activeLocation.label) {
        setActiveLocation({ ...activeLocation, radius: radiusInput });
        return;
    }
    // If text exists but no active selection, trigger location check
    if (!activeLocation) {
        setLocationError("Please select a location from the suggestions.");
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOpenShoot = showOpenShootsOnly ? event.isOpenShoot : true;
      let matchesLocation = true;
      if (activeLocation && event.coordinates) {
        const dist = getDistanceFromLatLonInMiles(activeLocation.coords.lat, activeLocation.coords.lng, event.coordinates.lat, event.coordinates.lng);
        matchesLocation = dist <= activeLocation.radius;
      }
      return matchesSearch && matchesOpenShoot && matchesLocation;
    });
  }, [events, searchTerm, showOpenShootsOnly, activeLocation]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-espresso pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-gold mb-4">
             <Sparkles className="w-5 h-5 mr-2" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Curated Opportunities</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Event Marketplace</h1>
          <p className="mt-4 text-white/50 font-bold uppercase tracking-widest text-xs">Contract high-end roles or secure Open Shoot entrances.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col gap-10 border border-black/5">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-grow w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gold" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold transition-all font-bold text-sm"
                placeholder="Search by event title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center bg-cream/20 border border-black/5 px-6 py-3.5 rounded-2xl">
                <span className="text-xs font-black text-espresso uppercase tracking-widest mr-4">Open Shoots Only</span>
                <button 
                  onClick={() => setShowOpenShootsOnly(!showOpenShootsOnly)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showOpenShootsOnly ? 'bg-gold' : 'bg-espresso/10'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showOpenShootsOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-5 relative">
              <label className="block text-[9px] font-black text-espresso uppercase tracking-[0.2em] mb-2.5">Territory Search</label>
              <div className="flex items-center gap-2">
                <div className="flex-grow h-12 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
                    <MapPin className="h-4 w-4 text-muted" />
                  </div>
                  <input 
                    ref={autocompleteInputRef}
                    type="text" 
                    className="block w-full h-full pl-12 pr-4 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-gold transition-all font-bold text-xs" 
                    placeholder="Enter City, Venue, or Postal Code..." 
                    value={locationQuery} 
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleUseCurrentLocation} 
                  title="Use current location"
                  className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-cream text-espresso hover:bg-gold transition-all shadow-sm border border-black/5 active:scale-95"
                >
                  {isLocating ? <Loader className="w-5 h-5 animate-spin" /> : <Crosshair className="h-5 h-5" />}
                </button>
              </div>
              {locationError && <p className="text-[10px] text-error font-black mt-2 uppercase tracking-widest">{locationError}</p>}
            </div>

            <div className="lg:col-span-4">
               <div className="flex justify-between items-center mb-2.5">
                 <label className="block text-[9px] font-black text-espresso uppercase tracking-[0.2em]">Travel Radius</label>
                 <span className="text-[10px] font-black text-gold bg-espresso px-3 py-1 rounded-lg shadow-xl">{radiusInput} MILES</span>
               </div>
               <div className="p-1 bg-gray-50/50 rounded-full border border-black/5">
                  <input type="range" min="5" max="200" step="5" value={radiusInput} onChange={(e) => setRadiusInput(Number(e.target.value))} className="w-full h-2 bg-cream rounded-full appearance-none cursor-pointer accent-gold" />
               </div>
            </div>

            <div className="lg:col-span-3 flex gap-2">
               <button onClick={handleManualSearch} className="flex-1 bg-espresso text-gold h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2A2522] shadow-2xl transition-all active:scale-95">Refresh Scope</button>
               {activeLocation && <button onClick={() => { setActiveLocation(null); setLocationQuery(''); setLocationError(null); }} className="bg-cream text-espresso border border-black/5 h-12 px-4 rounded-2xl hover:bg-white transition-all"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                isBookmarked={bookmarks.includes(event.id)}
                onToggleBookmark={onToggleBookmark}
                onClick={onEventClick} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-black/5 shadow-inner">
            <Navigation className="mx-auto h-20 w-20 text-gold/20 mb-4" />
            <h3 className="text-xl font-black text-espresso">No matching gigs found</h3>
            <p className="mt-2 text-muted font-bold text-sm">Expand your search radius or clear filters to see more.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;