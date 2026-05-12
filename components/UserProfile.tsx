
import React, { useState, useEffect } from 'react';
import type { User, ClockLog, UserPreferences, UserWorkLocation } from '../types';
import { Page } from '../types';
import { WorkLocationPicker } from './WorkLocationPicker';

interface UserProfileProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
  clockLogs?: ClockLog[];
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, clockLogs = [] }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl || '',
    pinNumber: user.pinNumber || '',
  });
  
  const defaultPrefs: UserPreferences = {
    theme: 'system',
    notificationsEnabled: true,
    defaultPage: Page.Dashboard
  };
  
  const [prefs, setPrefs] = useState<UserPreferences>(user.preferences || defaultPrefs);
  const [workLocation, setWorkLocation] = useState<UserWorkLocation | undefined>(user.workLocation);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
      setFormData({
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl || '',
          pinNumber: user.pinNumber || '',
      });
      setPrefs(user.preferences || defaultPrefs);
      setWorkLocation(user.workLocation);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefChange = (field: keyof UserPreferences, value: any) => {
    setPrefs(prev => {
      const updatedPrefs = { ...prev, [field]: value };
      if (field === 'theme') {
        onUpdateUser({ preferences: updatedPrefs });
      }
      return updatedPrefs;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
        setMessage({ type: 'error', text: 'Name and Username are required.' });
        return;
    }

    onUpdateUser({
        name: formData.name,
        username: formData.username,
        avatarUrl: formData.avatarUrl,
        pinNumber: formData.pinNumber,
        preferences: prefs,
        workLocation:
          workLocation?.county && workLocation?.town
            ? workLocation
            : undefined,
    });
    
    setMessage({ type: 'success', text: 'Profile updated successfully.' });
    
    setTimeout(() => {
        setMessage(null);
    }, 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white">Account Information</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                <p>Update your personal information, profile picture, security PIN, and your primary Kenya territory.</p>
            </div>
            <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <img 
                            className="h-24 w-24 rounded-full object-cover bg-gray-200 dark:bg-gray-700 border-2 border-yellow-500" 
                            src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`} 
                            alt="Current profile" 
                        />
                        {user.isClockedIn && (
                            <span className="absolute bottom-0 right-0 block h-6 w-6 rounded-full ring-4 ring-white dark:ring-gray-800 bg-green-400" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Profile Photo
                        </label>
                        <div className="mt-1 flex items-center">
                             <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.isClockedIn ? 'Currently Active' : 'Currently Offline'}
                             </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="col-span-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                        />
                    </div>

                    <div className="col-span-1">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                        />
                    </div>

                    <div className="col-span-1">
                        <label htmlFor="pinNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Business PIN
                        </label>
                        <input
                            type="text"
                            name="pinNumber"
                            id="pinNumber"
                            maxLength={4}
                            pattern="\d*"
                            value={formData.pinNumber}
                            onChange={handleChange}
                            placeholder="1234"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none font-mono"
                        />
                        <p className="mt-1 text-[10px] text-gray-400 uppercase font-bold">4-digit code for shift verification</p>
                    </div>

                    <div className="col-span-2 border-t border-gray-100 dark:border-gray-700 pt-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                            Primary territory (Kenya)
                        </h4>
                        <WorkLocationPicker
                            idPrefix="profile-wl"
                            value={workLocation}
                            onChange={setWorkLocation}
                        />
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Avatar URL
                        </label>
                        <input
                            type="url"
                            name="avatarUrl"
                            id="avatarUrl"
                            value={formData.avatarUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/my-photo.jpg"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">My Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Display Theme</label>
                            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                {['light', 'dark', 'system'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => handlePrefChange('theme', t)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            prefs.theme === t 
                                            ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Push Notifications</label>
                            <div className="flex items-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => handlePrefChange('notificationsEnabled', !prefs.notificationsEnabled)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                                        prefs.notificationsEnabled ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            prefs.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {prefs.notificationsEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Default Landing Page</label>
                            <select
                                value={prefs.defaultPage}
                                onChange={(e) => handlePrefChange('defaultPage', e.target.value as Page)}
                                className="block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                            >
                                <option value={Page.Dashboard}>Dashboard</option>
                                <option value={Page.Products}>Products</option>
                                <option value={Page.Orders}>Orders</option>
                                <option value={Page.Clients}>Clients</option>
                                <option value={Page.Tasks}>Tasks</option>
                            </select>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50'}`}>
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                            {message.text}
                        </p>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-blue-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                        Save All Changes
                    </button>
                </div>
            </form>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Shift Activity History</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Historical record of all clock-in and clock-out events.</p>
            
            <div className="flow-root">
                {clockLogs.length > 0 ? (
                    <ul className="-mb-8">
                        {clockLogs.map((log, logIdx) => (
                            <li key={log.id}>
                                <div className="relative pb-8">
                                    {logIdx !== clockLogs.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                                                log.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                                            }`}>
                                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {log.type === 'in' 
                                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    }
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    Shift <span className="font-bold text-gray-900 dark:text-white">{log.type === 'in' ? 'Started' : 'Ended'}</span>
                                                </p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                <time dateTime={log.timestamp}>
                                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">No shift records found.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
