
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Client, LiveLocation, User } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPinIcon, CrosshairsIcon } from './icons';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface ClientMapProps {
  clients: Client[];
  users?: User[];
  liveLocations?: LiveLocation[];
  currentUser?: User;
  onManualLocationResolved?: (location: { lat: number; lng: number; accuracy: number; address: string }) => void;
}

/** Approximate centre of Kenya for default map view. */
const KENYA_CENTER: google.maps.LatLngLiteral = { lat: 0.1769, lng: 37.9083 };

/** Soft restriction keeps focus on Kenya while allowing panning to nearby areas. */
const KENYA_MAP_RESTRICTION: google.maps.MapRestriction = {
  latLngBounds: { north: 5.2, south: -4.9, east: 42.0, west: 33.7 },
  strictBounds: false,
};

const CLIENT_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const YOU_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
const SALES_REP_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
const SEARCH_LOCATION_MARKER_ICON = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
const FALLBACK_GOOGLE_MAPS_API_KEY = 'AIzaSyB-iTK1ikEqYNXdfhD07uyNRWQDM4FzaYI';

// Simple projection for SVG fallback (Kenya bounds)
const project = (lat: number, lng: number) => {
  const minLng = 33;
  const maxLng = 42;
  const minLat = -5;
  const maxLat = 5.5;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return { x, y };
};

const getAreaBreakdown = (address: string) => {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  const countyPart = parts.find(part => part.toLowerCase().includes('county')) || 'County Not Specified';
  const areaPart = parts.length > 1 ? parts[1] : parts[0] || 'Area Not Specified';
  return { county: countyPart, area: areaPart };
};

const LocationPermissionModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
    <div className="p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800 max-w-sm mx-4 text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Enable Location?</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Acumen needs access to your device location to show you live on the map next to client pins (Google Maps, Kenya).
      </p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-1.5 text-sm font-bold text-blue-900 bg-yellow-500 rounded-md hover:bg-yellow-400"
        >
          Allow
        </button>
      </div>
    </div>
  </div>
);

type DetailedClient = Client & { details: { county: string; area: string } };
type ActiveRepLocation = LiveLocation & { user: User; lastSeenLabel: string; title: string };
type LocationSearchRequest = { label: string; query: string };
type LocatedSearch = LocationSearchRequest & { lat: number; lng: number; address: string };

interface MapCanvasProps {
  visibleClients: DetailedClient[];
  activeRepLocations: ActiveRepLocation[];
  locationSearch: LocationSearchRequest | null;
  position: GeolocationPosition | null;
  loading: boolean;
  error: GeolocationPositionError | null;
  isEnabled: boolean;
  showConfirm: boolean;
  deniedByUser: boolean;
  onRequestLocation: () => void;
  onConfirmLocation: () => void;
  onCancelLocation: () => void;
  onManualLocationResolved?: (location: { lat: number; lng: number; accuracy: number; address: string }) => void;
}

/** Google Maps (region KE, English) with client markers and live sales rep marker. */
const GoogleKenyaMapCanvas: React.FC<MapCanvasProps & { apiKey: string }> = ({
  visibleClients,
  activeRepLocations,
  locationSearch,
  position,
  loading,
  error,
  isEnabled,
  showConfirm,
  deniedByUser,
  onRequestLocation,
  onConfirmLocation,
  onCancelLocation,
  onManualLocationResolved,
  apiKey,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [locatedSearch, setLocatedSearch] = useState<LocatedSearch | null>(null);
  const [searchLookupStatus, setSearchLookupStatus] = useState<'idle' | 'loading' | 'not-found' | 'error'>('idle');
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'acumen-google-maps',
    googleMapsApiKey: apiKey,
    language: 'en',
    region: 'KE',
  });

  const mapContainerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (locatedSearch) {
      map.setCenter({ lat: locatedSearch.lat, lng: locatedSearch.lng });
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    visibleClients.forEach(c => {
      bounds.extend({ lat: c.location.lat, lng: c.location.lng });
    });
    activeRepLocations.forEach(location => {
      bounds.extend({ lat: location.lat, lng: location.lng });
    });
    if (position) {
      bounds.extend({ lat: position.coords.latitude, lng: position.coords.longitude });
    }

    if (visibleClients.length === 0 && activeRepLocations.length === 0 && !position) {
      map.setCenter(KENYA_CENTER);
      map.setZoom(6.2);
      return;
    }

    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
      const z = map.getZoom();
      if (z !== undefined && z > 14) map.setZoom(14);
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [isLoaded, visibleClients, activeRepLocations, locatedSearch, position]);

  useEffect(() => {
    if (!isLoaded || !locationSearch) {
      setLocatedSearch(null);
      setSearchLookupStatus('idle');
      return;
    }

    let cancelled = false;
    setSearchLookupStatus('loading');

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: locationSearch.query,
        componentRestrictions: { country: 'KE' },
      },
      (results, status) => {
        if (cancelled) return;

        const location = results?.[0]?.geometry.location;
        if (status === 'OK' && location) {
          const resolvedLocation = {
            ...locationSearch,
            lat: location.lat(),
            lng: location.lng(),
            address: results?.[0]?.formatted_address || locationSearch.label,
          };
          setLocatedSearch(resolvedLocation);
          setSearchLookupStatus('idle');
          onManualLocationResolved?.({
            lat: resolvedLocation.lat,
            lng: resolvedLocation.lng,
            accuracy: 25,
            address: resolvedLocation.address,
          });
          return;
        }

        setLocatedSearch(null);
        setSearchLookupStatus(status === 'ZERO_RESULTS' ? 'not-found' : 'error');
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isLoaded, locationSearch, onManualLocationResolved]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[280px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 text-center">
        Could not load Google Maps. Check your API key and that the Maps JavaScript API is enabled.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[280px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
        Loading Kenya map…
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
      {showConfirm && <LocationPermissionModal onConfirm={onConfirmLocation} onCancel={onCancelLocation} />}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={KENYA_CENTER}
        zoom={6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          restriction: KENYA_MAP_RESTRICTION,
        }}
      >
        {visibleClients.map(client => (
          <Marker
            key={client.id}
            position={{ lat: client.location.lat, lng: client.location.lng }}
            title={`${client.company} — ${client.location.address}`}
            icon={{ url: CLIENT_MARKER_ICON }}
          />
        ))}
        {position && (
          <Marker
            position={{ lat: position.coords.latitude, lng: position.coords.longitude }}
            title="You (live)"
            icon={{ url: YOU_MARKER_ICON }}
          />
        )}
        {activeRepLocations.map(location => (
          <Marker
            key={`rep-${location.userId}`}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.title}
            icon={{ url: SALES_REP_MARKER_ICON }}
          />
        ))}
        {locatedSearch && (
          <Marker
            position={{ lat: locatedSearch.lat, lng: locatedSearch.lng }}
            title={`Selected location: ${locatedSearch.address}`}
            icon={{ url: SEARCH_LOCATION_MARKER_ICON }}
          />
        )}
      </GoogleMap>

      {!isEnabled && !deniedByUser && !showConfirm && (
        <button
          type="button"
          onClick={onRequestLocation}
          className="absolute top-3 right-3 z-[1] flex items-center px-2 py-1.5 text-xs font-medium text-white bg-blue-600/90 hover:bg-blue-700 rounded-md shadow-lg backdrop-blur-sm"
        >
          <CrosshairsIcon className="w-4 h-4 mr-1" />
          My live location
        </button>
      )}
      {deniedByUser && (
        <span className="absolute top-3 right-3 z-[1] px-2 py-1 text-xs text-white bg-gray-900/75 rounded-md">Location denied</span>
      )}

      {loading && (
        <div className="absolute top-3 left-3 z-[1] px-2 py-1 text-xs text-white bg-gray-900/75 backdrop-blur rounded-md">Locating you…</div>
      )}
      {error && isEnabled && (
        <div className="absolute top-3 left-3 z-[1] max-w-[90%] px-2 py-1 text-xs text-white bg-red-600/90 rounded-md">
          Location: {error.message}
        </div>
      )}
      {searchLookupStatus === 'loading' && (
        <div className="absolute top-11 left-3 z-[1] px-2 py-1 text-xs text-white bg-gray-900/75 backdrop-blur rounded-md">Finding typed location…</div>
      )}
      {(searchLookupStatus === 'not-found' || searchLookupStatus === 'error') && locationSearch && (
        <div className="absolute top-11 left-3 z-[1] max-w-[90%] px-2 py-1 text-xs text-white bg-red-600/90 rounded-md">
          Could not find that location. Try adding the town, county, or a nearby landmark.
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-[1] px-2 py-0.5 text-[10px] text-gray-700 bg-white/85 dark:bg-gray-900/85 dark:text-gray-300 rounded shadow">
        Google Maps · Kenya region · Blue: clients · Yellow: active sales reps · Green: you · Red: typed location
      </div>
    </div>
  );
};

/** SVG fallback when no API key is configured. */
const SvgKenyaMapCanvas: React.FC<MapCanvasProps> = ({
  visibleClients,
  activeRepLocations,
  locationSearch,
  position,
  loading,
  error,
  isEnabled,
  showConfirm,
  deniedByUser,
  onRequestLocation,
  onConfirmLocation,
  onCancelLocation,
}) => (
  <div className="relative w-full overflow-hidden text-gray-400 bg-gray-100 rounded-lg aspect-video dark:bg-gray-700 min-h-[280px]">
    {showConfirm && <LocationPermissionModal onConfirm={onConfirmLocation} onCancel={onCancelLocation} />}

    <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-0">
      <text x="5" y="45" fontSize="3" fill="currentColor" opacity="0.5">
        KENYA (add VITE_GOOGLE_MAPS_API_KEY for Google Maps)
      </text>
    </svg>

    {visibleClients.map(client => {
      const { x, y } = project(client.location.lat, client.location.lng);
      return (
        <div
          key={client.id}
          className="absolute -translate-x-1/2 -translate-y-full group z-0"
          style={{ left: `${x}%`, top: `${y}%` }}
          title={client.company}
        >
          <MapPinIcon className="w-6 h-6 text-blue-500 drop-shadow-lg" />
          <span className="absolute bottom-full mb-2 w-56 px-2 py-1.5 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10 shadow-lg">
            <span className="block font-semibold">{client.company}</span>
            <span className="block text-[11px] text-gray-200 truncate">{client.location.address}</span>
            <span className="block text-[11px] text-gray-300 mt-0.5">
              {client.location.lat.toFixed(4)}, {client.location.lng.toFixed(4)}
            </span>
          </span>
        </div>
      );
    })}

    {activeRepLocations.map(location => {
      const { x, y } = project(location.lat, location.lng);
      return (
        <div
          key={`rep-${location.userId}`}
          className="absolute -translate-x-1/2 -translate-y-1/2 group z-0"
          style={{ left: `${x}%`, top: `${y}%` }}
          title={location.title}
        >
          <span className="relative flex w-6 h-6">
            <span className="absolute inline-flex w-full h-full bg-yellow-400 rounded-full opacity-75 animate-ping" />
            <CrosshairsIcon className="relative inline-flex w-6 h-6 text-yellow-600 drop-shadow-lg" />
          </span>
          <span className="absolute bottom-full mb-2 w-56 px-2 py-1.5 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10 shadow-lg">
            <span className="block font-semibold">{location.user.name}</span>
            <span className="block text-[11px] text-gray-200">{location.lastSeenLabel}</span>
            <span className="block text-[11px] text-gray-300 mt-0.5">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </span>
        </div>
      );
    })}

    {loading && (
      <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-gray-900/75 backdrop-blur rounded-md">Locating…</div>
    )}
    {error && isEnabled && (
      <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-red-600/90 rounded-md">Locating Error: {error.message}</div>
    )}
    {locationSearch && (
      <div className="absolute top-10 left-2 max-w-[90%] px-2 py-1 text-xs text-white bg-gray-900/75 rounded-md">
        Typed: {locationSearch.label}. Google Maps is needed to place the exact location marker.
      </div>
    )}

    {position &&
      (() => {
        const { x, y } = project(position.coords.latitude, position.coords.longitude);
        return (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-0"
            style={{ left: `${x}%`, top: `${y}%` }}
            title="Your Location"
          >
            <span className="relative flex w-6 h-6">
              <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping" />
              <CrosshairsIcon className="relative inline-flex w-6 h-6 text-green-600" />
            </span>
            <span className="absolute bottom-full mb-2 w-max px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">
              Your Location
            </span>
          </div>
        );
      })()}

    {!isEnabled && !deniedByUser && !showConfirm && (
      <button
        type="button"
        onClick={onRequestLocation}
        className="absolute top-2 right-2 z-[1] flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded"
      >
        <CrosshairsIcon className="w-4 h-4 mr-1" />
        Enable My Location
      </button>
    )}
    {deniedByUser && (
      <span className="absolute top-2 right-2 z-[1] text-xs text-gray-500 dark:text-gray-400">Location access denied.</span>
    )}
  </div>
);

const formatLastSeen = (timestamp: string) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return 'Last update unknown';
  return `Last update: ${parsed.toLocaleString()}`;
};

export const ClientMap: React.FC<ClientMapProps> = ({ clients, users = [], liveLocations = [], currentUser, onManualLocationResolved }) => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || FALLBACK_GOOGLE_MAPS_API_KEY;
  const useGoogleMaps = Boolean(googleMapsApiKey);

  const [isEnabled, setIsEnabled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deniedByUser, setDeniedByUser] = useState(false);
  const [countyFilter, setCountyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typedLocation, setTypedLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState<LocationSearchRequest | null>(null);

  const { position, loading, error } = useGeolocation(isEnabled, { watch: useGoogleMaps });

  const handleRequestLocation = () => {
    setDeniedByUser(false);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setIsEnabled(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setDeniedByUser(true);
    setIsEnabled(false);
  };

  const handleTypedLocationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = typedLocation.trim();
    if (!label) {
      setLocationSearch(null);
      return;
    }

    const query = /\bkenya\b/i.test(label) ? label : `${label}, Kenya`;
    setLocationSearch({ label, query });
  };

  const detailedClients = useMemo(
    () =>
      [...clients]
        .map(client => ({
          ...client,
          details: getAreaBreakdown(client.location.address),
        }))
        .sort(
          (a, b) => a.details.county.localeCompare(b.details.county) || a.company.localeCompare(b.company)
        ),
    [clients]
  );

  const uniqueCounties = useMemo(
    () => Array.from(new Set(detailedClients.map(client => client.details.county))),
    [detailedClients]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleClients = useMemo(
    () =>
      detailedClients.filter(client => {
        const matchesCounty = countyFilter === 'all' || client.details.county === countyFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          client.company.toLowerCase().includes(normalizedSearch) ||
          client.details.area.toLowerCase().includes(normalizedSearch) ||
          client.location.address.toLowerCase().includes(normalizedSearch);
        return matchesCounty && matchesSearch;
      }),
    [detailedClients, countyFilter, normalizedSearch]
  );

  const activeRepLocations = useMemo<ActiveRepLocation[]>(
    () =>
      liveLocations
        .filter(location => location.isActive && Number.isFinite(location.lat) && Number.isFinite(location.lng))
        .map(location => {
          const user = users.find(u => u.id === location.userId);
          if (!user || user.role !== 'Sales Representative') return null;
          const lastSeenLabel = formatLastSeen(location.timestamp);
          return {
            ...location,
            user,
            lastSeenLabel,
            title: `${user.name} (active sales rep) - ${lastSeenLabel}`,
          };
        })
        .filter((location): location is ActiveRepLocation => Boolean(location))
        .sort((a, b) => a.user.name.localeCompare(b.user.name)),
    [liveLocations, users]
  );

  const mapProps: MapCanvasProps = {
    visibleClients,
    activeRepLocations,
    locationSearch,
    position,
    loading,
    error,
    isEnabled,
    showConfirm,
    deniedByUser,
    onRequestLocation: handleRequestLocation,
    onConfirmLocation: handleConfirm,
    onCancelLocation: handleCancel,
    onManualLocationResolved,
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client & Sales Rep Locations</h3>
        {!useGoogleMaps && (
          <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md">
            Set <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">.env</code> for full Google Maps (Kenya).
          </p>
        )}
      </div>

      <div className="mb-4 border border-yellow-200 rounded-lg bg-yellow-50/70 dark:bg-yellow-900/10 dark:border-yellow-700/60 p-3">
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Type Your Exact Location</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Enter a building, road, estate, landmark, town, or county and Google Maps will place it on the map.
            {currentUser?.isClockedIn ? ' This also updates your live location for admins.' : ' Clock in to sync it as your live location.'}
          </p>
        </div>
        <form onSubmit={handleTypedLocationSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={typedLocation}
            onChange={e => setTypedLocation(e.target.value)}
            placeholder="e.g. Two Rivers Mall, Ruaka or Kenyatta Avenue, Nairobi"
            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-yellow-500 rounded-md hover:bg-yellow-400 disabled:opacity-50"
            disabled={!typedLocation.trim()}
          >
            Show on map
          </button>
        </form>
        {locationSearch && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            Searching: <span className="font-semibold">{locationSearch.label}</span>
          </p>
        )}
      </div>

      {useGoogleMaps ? (
        <GoogleKenyaMapCanvas {...mapProps} apiKey={googleMapsApiKey} />
      ) : (
        <SvgKenyaMapCanvas {...mapProps} />
      )}

      <div className="mt-4 border border-gray-200 rounded-lg dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Kenya Coverage Details</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">All client areas with county and coordinates for visibility.</p>
        </div>
        <div className="px-3 py-2 grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search company or area..."
            className="md:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <select
            value={countyFilter}
            onChange={e => setCountyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="all">All Counties</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {visibleClients.map(client => (
            <div key={client.id} className="px-3 py-2.5 text-xs">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{client.company}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {client.details.area} - {client.details.county}
              </p>
              <p className="text-gray-500 dark:text-gray-400">{client.location.address}</p>
              <p className="text-gray-500 dark:text-gray-400">
                Coordinates: {client.location.lat.toFixed(5)}, {client.location.lng.toFixed(5)}
              </p>
              {useGoogleMaps && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${client.location.lat},${client.location.lng}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-blue-600 hover:underline dark:text-blue-400"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          ))}
          {visibleClients.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
              No matching locations for the current filter/search.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border border-gray-200 rounded-lg dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Active Sales Reps</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Latest synced GPS location for reps who are clocked in.</p>
        </div>
        <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {activeRepLocations.map(location => (
            <div key={location.userId} className="px-3 py-2.5 text-xs">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{location.user.name}</p>
              <p className="text-gray-600 dark:text-gray-300">{location.user.workLocation?.town || 'Town not set'}, {location.user.workLocation?.county || 'County not set'}</p>
              <p className="text-gray-500 dark:text-gray-400">{location.lastSeenLabel}</p>
              <p className="text-gray-500 dark:text-gray-400">
                Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                {location.accuracy ? ` (accuracy ${Math.round(location.accuracy)}m)` : ''}
              </p>
            </div>
          ))}
          {activeRepLocations.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
              No active sales rep locations yet. Reps must clock in and allow location access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
