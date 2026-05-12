import React, { useMemo } from 'react';
import type { UserWorkLocation } from '../types';
import { KENYAN_COUNTIES_AND_TOWNS, getTownsForCounty } from '../data/kenyanLocations';

interface WorkLocationPickerProps {
  value: UserWorkLocation | undefined;
  onChange: (next: UserWorkLocation) => void;
  idPrefix?: string;
}

export const WorkLocationPicker: React.FC<WorkLocationPickerProps> = ({ value, onChange, idPrefix = 'wl' }) => {
  const county = value?.county ?? '';
  const towns = useMemo(() => getTownsForCounty(county), [county]);

  const setCounty = (nextCounty: string) => {
    if (!nextCounty) {
      onChange({ county: '', town: '', addressLine: value?.addressLine });
      return;
    }
    const nextTowns = getTownsForCounty(nextCounty);
    onChange({
      county: nextCounty,
      town: nextTowns[0] ?? '',
      addressLine: value?.addressLine,
    });
  };

  const setTown = (town: string) => {
    onChange({ county, town, addressLine: value?.addressLine });
  };

  const setAddressLine = (addressLine: string) => {
    onChange({ county, town: value?.town ?? '', addressLine: addressLine || undefined });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-county`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          County
        </label>
        <select
          id={`${idPrefix}-county`}
          value={county}
          onChange={e => setCounty(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">— Select county —</option>
          {KENYAN_COUNTIES_AND_TOWNS.map(c => (
            <option key={c.county} value={c.county}>
              {c.county}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-town`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Town / ward centre
        </label>
        <select
          id={`${idPrefix}-town`}
          value={value?.town ?? ''}
          onChange={e => setTown(e.target.value)}
          disabled={!county}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
        >
          {!county ? (
            <option value="">Select a county first</option>
          ) : (
            towns.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Street / landmark (optional)
        </label>
        <input
          id={`${idPrefix}-address`}
          type="text"
          value={value?.addressLine ?? ''}
          onChange={e => setAddressLine(e.target.value)}
          placeholder="e.g. Kimathi Street, CBD"
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  );
};
