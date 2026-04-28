
import React, { useState } from 'react';
import type { Client } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPinIcon, CrosshairsIcon } from './icons';

interface ClientMapProps {
  clients: Client[];
}

// A simple projection to map lat/lng to x/y coordinates for a Kenya map approximately
// This is a placeholder and not a real cartographic projection
const project = (lat: number, lng: number) => {
  // Rough bounds for Kenya: lat ~ -5 to 5.5, lng ~ 33 to 42
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
                Acumen needs access to your location to show your position relative to clients on the map.
            </p>
            <div className="flex justify-center gap-3">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    Deny
                </button>
                <button
                    onClick={onConfirm}
                    className="px-3 py-1.5 text-sm font-bold text-blue-900 bg-yellow-500 rounded-md hover:bg-yellow-400"
                >
                    Allow
                </button>
            </div>
        </div>
    </div>
);

export const ClientMap: React.FC<ClientMapProps> = ({ clients }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deniedByUser, setDeniedByUser] = useState(false);
  const [countyFilter, setCountyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { position, loading, error } = useGeolocation(isEnabled);

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

  const detailedClients = [...clients]
    .map(client => ({
      ...client,
      details: getAreaBreakdown(client.location.address),
    }))
    .sort((a, b) => a.details.county.localeCompare(b.details.county) || a.company.localeCompare(b.company));

  const uniqueCounties = Array.from(new Set(detailedClients.map(client => client.details.county)));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleClients = detailedClients.filter(client => {
    const matchesCounty = countyFilter === 'all' || client.details.county === countyFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      client.company.toLowerCase().includes(normalizedSearch) ||
      client.details.area.toLowerCase().includes(normalizedSearch) ||
      client.location.address.toLowerCase().includes(normalizedSearch);
    return matchesCounty && matchesSearch;
  });

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Locations</h3>
          {!isEnabled && !deniedByUser && (
              <button 
                onClick={handleRequestLocation}
                className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                  <CrosshairsIcon className="w-4 h-4 mr-1" />
                  Enable My Location
              </button>
          )}
          {deniedByUser && (
               <span className="text-xs text-gray-500 dark:text-gray-400">Location access denied.</span>
          )}
      </div>
      
      <div className="relative w-full overflow-hidden text-gray-400 bg-gray-100 rounded-lg aspect-video dark:bg-gray-700">
        
        {showConfirm && (
            <LocationPermissionModal onConfirm={handleConfirm} onCancel={handleCancel} />
        )}

        <svg viewBox="0 0 100 50" className="w-full h-full">
            <text x="5" y="45" fontSize="3" fill="currentColor" opacity="0.5">KENYA</text>
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
        
        {loading && <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-gray-900/75 backdrop-blur rounded-md">Locating...</div>}
        
        {error && isEnabled && <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-red-600/90 rounded-md">Locating Error: {error.message}</div>}

        {position && (() => {
          const { x, y } = project(position.coords.latitude, position.coords.longitude);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-0"
              style={{ left: `${x}%`, top: `${y}%` }}
              title="Your Location"
            >
                <span className="relative flex w-6 h-6">
                    <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
                    <CrosshairsIcon className="relative inline-flex w-6 h-6 text-green-600"/>
                </span>
                <span className="absolute bottom-full mb-2 w-max px-2 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">Your Location</span>
            </div>
          );
        })()}
      </div>

      <div className="mt-4 border border-gray-200 rounded-lg dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Kenya Coverage Details</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">All client areas with county and coordinates for visibility.</p>
        </div>
        <div className="px-3 py-2 grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company or area..."
            className="md:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="all">All Counties</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {visibleClients.map(client => (
            <div key={client.id} className="px-3 py-2.5 text-xs">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{client.company}</p>
              <p className="text-gray-600 dark:text-gray-300">{client.details.area} - {client.details.county}</p>
              <p className="text-gray-500 dark:text-gray-400">{client.location.address}</p>
              <p className="text-gray-500 dark:text-gray-400">Coordinates: {client.location.lat.toFixed(5)}, {client.location.lng.toFixed(5)}</p>
            </div>
          ))}
          {visibleClients.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
              No matching locations for the current filter/search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
