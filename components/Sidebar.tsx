
import React from 'react';
import type { User } from '../types';
import { Page } from '../types';
import { DashboardIcon, ProductIcon, OrderIcon, ClientIcon, LogoutIcon, ClipboardDocumentCheckIcon, CompanyLogo, UsersIcon } from './icons';

interface SidebarProps {
  user: User;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  appName: string;
  logoUrl?: string;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-blue-900 bg-yellow-500'
        : 'text-blue-100 hover:bg-blue-800'
    }`}
  >
    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-900' : 'text-yellow-500'}`} />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setCurrentPage, onLogout, isSidebarOpen, appName, logoUrl }) => {
  const navItems = [
    { id: Page.Dashboard, icon: DashboardIcon, label: 'Dashboard' },
    { id: Page.Products, icon: ProductIcon, label: 'Products' },
    { id: Page.Orders, icon: OrderIcon, label: 'Orders' },
    { id: Page.Clients, icon: ClientIcon, label: 'Clients' },
    { id: Page.Tasks, icon: ClipboardDocumentCheckIcon, label: 'Tasks' },
  ];

  // Only admins see User Management
  if (user.role === 'Admin') {
    navItems.push({ id: Page.Users, icon: UsersIcon, label: 'User Management' });
  }

  return (
    <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-blue-900 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-20 border-b border-blue-800 bg-blue-950/30">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-md object-cover shadow-sm bg-white" />
          ) : (
            <CompanyLogo className="w-10 h-10 rounded-md shadow-sm" />
          )}
          <span className="ml-3 text-xl font-bold text-white tracking-wide truncate max-w-[10.5rem]">{appName}</span>
        </div>
        <nav className="flex-1 mt-6 space-y-1">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.id}
              onClick={() => setCurrentPage(item.id)}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
            <button
                onClick={() => setCurrentPage(Page.Profile)}
                className={`flex items-center w-full p-2 mb-4 text-left rounded-lg transition-colors duration-200 group relative ${currentPage === Page.Profile ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                title="View User Profile"
            >
                <div className="relative">
                    <img 
                        className="w-10 h-10 rounded-full object-cover bg-gray-300 border-2 border-yellow-500"
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                        alt={user.name}
                    />
                    {user.isClockedIn && (
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-blue-900" />
                    )}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-yellow-400">{user.name}</p>
                    <p className="text-xs text-blue-300 truncate">{user.role}</p>
                </div>
            </button>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-blue-200 transition-colors duration-200 rounded-lg hover:bg-red-900/50 hover:text-red-200"
          >
            <LogoutIcon className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
