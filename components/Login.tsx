
import React, { useState, useEffect } from 'react';
import type { User, AppBranding } from '../types';
import { CompanyLogo } from './icons';
import { loadSharedAppState } from '../lib/sharedAppState';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const defaultBranding: AppBranding = { appName: 'Acme Business Suite' };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [branding, setBranding] = useState<AppBranding>(() => {
    try {
      const savedBranding = localStorage.getItem('appBranding');
      if (!savedBranding) return defaultBranding;
      const parsed = JSON.parse(savedBranding) as Partial<AppBranding>;
      return {
        appName: parsed.appName?.trim() || defaultBranding.appName,
        logoUrl: parsed.logoUrl?.trim() || undefined,
      };
    } catch {
      return defaultBranding;
    }
  });

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const saved = localStorage.getItem('users');
        if (saved && !cancelled) {
          setUsers(JSON.parse(saved));
        } else {
          const m = await import('../data/mockData');
          if (!cancelled) setUsers(m.MOCK_USERS);
        }

        const shared = await loadSharedAppState();
        if (!cancelled && shared?.data?.users?.length) {
          setUsers(shared.data.users);
          localStorage.setItem('users', JSON.stringify(shared.data.users));
        }
        if (!cancelled && shared?.data?.branding) {
          const sharedBranding: AppBranding = {
            appName: shared.data.branding.appName?.trim() || defaultBranding.appName,
            logoUrl: shared.data.branding.logoUrl?.trim() || undefined,
          };
          setBranding(sharedBranding);
          localStorage.setItem('appBranding', JSON.stringify(sharedBranding));
        }
      } catch (error) {
        console.warn('Could not load shared users for login.', error);
        if (!cancelled) {
          const m = await import('../data/mockData');
          setUsers(m.MOCK_USERS);
        }
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = branding.appName;
  }, [branding.appName]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
      if (user.isActive === false) {
        setError('This account has been disabled. Please contact an administrator.');
        return;
      }
      setError('');
      onLogin(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl dark:bg-gray-800 border-t-4 border-yellow-500">
        <div className="text-center">
            <div className="flex flex-col justify-center items-center mb-6">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.appName} className="w-20 h-20 rounded-xl object-cover shadow-lg mb-2 bg-white" />
                ) : (
                  <CompanyLogo className="w-20 h-20 rounded-xl shadow-lg mb-2" />
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">{branding.appName}</h1>
            </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 pr-10 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c1.47 0 2.868-.267 4.158-.756M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m4.242 4.242L21 21m-6.172-6.172a3 3 0 0 0-4.243-4.243"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative flex justify-center w-full px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
