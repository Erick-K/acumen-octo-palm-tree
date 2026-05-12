
import React, { useState, useEffect } from 'react';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon, WarningIcon } from './icons';
import type { User, ClockLog } from '../types';

interface HeaderProps {
    title: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    user?: User;
    themePreference?: 'light' | 'dark' | 'system';
    onToggleClock?: () => void;
    lastClockLog?: ClockLog;
    onUpdateTheme?: (theme: 'light' | 'dark' | 'system') => void;
}

export const Header: React.FC<HeaderProps> = ({ title, isSidebarOpen, onToggleSidebar, user, themePreference = 'system', onToggleClock, lastClockLog, onUpdateTheme }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sessionTime, setSessionTime] = useState<string>('00:00:00');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?.isClockedIn && lastClockLog?.type === 'in') {
            const updateSession = () => {
                const start = new Date(lastClockLog.timestamp).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, now - start);
                
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                
                setSessionTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            };
            
            updateSession();
            const interval = setInterval(updateSession, 1000);
            return () => clearInterval(interval);
        } else {
            setSessionTime('00:00:00');
        }
    }, [user?.isClockedIn, lastClockLog]);

    const handleThemeToggle = () => {
        if (!onUpdateTheme) return;
        const currentTheme = themePreference;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        onUpdateTheme(newTheme);
    };

    const handleClockClick = () => {
        setPinInput('');
        setPinError(false);
        setShowPinModal(true);
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === user?.pinNumber) {
            onToggleClock?.();
            setShowPinModal(false);
        } else {
            setPinError(true);
            setPinInput('');
        }
    };

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTheme = themePreference;
    const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-20">
            <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center">
                    <button onClick={onToggleSidebar} className="p-2 mr-4 -ml-2 rounded-md lg:hidden hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle sidebar">
                        {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">{title}</h1>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                        onClick={handleThemeToggle}
                        className="group flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none"
                        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                    >
                        <div className="relative w-6 h-6">
                            {isDark ? <SunIcon className="w-6 h-6 animate-in zoom-in spin-in-90 duration-300" /> : <MoonIcon className="w-6 h-6 animate-in zoom-in spin-in-180 duration-300" />}
                        </div>
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest group-hover:scale-105 transition-transform">
                            {isDark ? 'Light' : 'Dark'}
                        </span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

                    {onToggleClock && user && (
                        <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-full border border-gray-200 dark:border-gray-600">
                            {user.isClockedIn && (
                                <div className="hidden md:flex flex-col items-center px-4">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Session</span>
                                    <span className="text-sm font-mono font-bold text-green-500">{sessionTime}</span>
                                </div>
                            )}
                            <button
                                onClick={handleClockClick}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 shadow-sm ${
                                    user.isClockedIn 
                                    ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95' 
                                    : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                                }`}
                            >
                                {user.isClockedIn ? 'Out' : 'In'}
                            </button>
                        </div>
                    )}
                    
                    <div className="hidden xl:block text-right border-l border-gray-200 dark:border-gray-700 pl-4">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white leading-none">{formattedTime}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mt-1 font-bold">{formattedDate}</p>
                    </div>
                </div>
            </div>

            {/* PIN Verification Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-700">
                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                <WarningIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verify Business PIN</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Please enter your 4-digit security PIN to clock {user?.isClockedIn ? 'out' : 'in'}.</p>
                            
                            <form onSubmit={handlePinSubmit} className="space-y-4">
                                <input
                                    type="password"
                                    maxLength={4}
                                    pattern="\d*"
                                    inputMode="numeric"
                                    autoFocus
                                    value={pinInput}
                                    onChange={(e) => {
                                        setPinInput(e.target.value);
                                        setPinError(false);
                                    }}
                                    className={`w-full px-4 py-3 text-center text-3xl tracking-[1.5rem] font-bold border-2 rounded-xl focus:outline-none focus:ring-4 transition-all dark:bg-gray-700 dark:text-white ${
                                        pinError 
                                        ? 'border-red-500 ring-red-500/20' 
                                        : 'border-gray-200 dark:border-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20'
                                    }`}
                                    placeholder="••••"
                                />
                                {pinError && <p className="text-xs font-bold text-red-500 animate-bounce">Incorrect PIN. Please try again.</p>}
                                
                                <div className="flex space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPinModal(false)}
                                        className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 text-sm font-bold text-blue-900 bg-yellow-500 rounded-xl hover:bg-yellow-400 transition-colors"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
