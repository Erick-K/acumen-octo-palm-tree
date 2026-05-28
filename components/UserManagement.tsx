
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, UserPreferences, UserWorkLocation, AppBranding } from '../types';
import { Page } from '../types';
import { PencilSquareIcon, Cog6ToothIcon, WarningIcon, CloseIcon } from './icons';
import { WorkLocationPicker } from './WorkLocationPicker';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (userId: number, data: Partial<User>) => void;
  onAddUser: (data: Omit<User, 'id'>) => void;
  onDeleteUser: (userId: number) => void;
  branding: AppBranding;
  onUpdateBranding: (branding: AppBranding) => void;
}

type SortKey = 'name' | 'username' | 'role' | 'status' | 'account';

export const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onUpdateUser, onAddUser, onDeleteUser, branding, onUpdateBranding }) => {
  const DEFAULT_APP_NAME = 'Acme Business Suite';
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingDetailsUserId, setEditingDetailsUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const appNameInputRef = useRef<HTMLInputElement | null>(null);
  const logoUrlInputRef = useRef<HTMLInputElement | null>(null);
  const [detailsDraft, setDetailsDraft] = useState<{ name: string; username: string; avatarUrl: string }>({ name: '', username: '', avatarUrl: '' });
  const [detailsWorkLocationDraft, setDetailsWorkLocationDraft] = useState<UserWorkLocation>({ county: '', town: '' });
  const [editingPrefsUserId, setEditingPrefsUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    pinNumber: '1234',
    role: 'Sales Representative' as User['role']
  });
  const [newUserWorkLocation, setNewUserWorkLocation] = useState<UserWorkLocation>({ county: '', town: '' });
  const [territoryDraft, setTerritoryDraft] = useState<UserWorkLocation>({ county: '', town: '' });

  // Filtering states
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Sales Representative'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In' | 'Out'>('All');
  const [accountFilter, setAccountFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Sorting states
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const handleUpdateClick = (user: User) => {
    setEditingUserId(user.id);
    setEditingDetailsUserId(null);
    setEditingPrefsUserId(null);
    setNewPassword('');
    setNewPin(user.pinNumber || '');
  };

  const handleEditDetailsClick = (user: User) => {
    setEditingDetailsUserId(user.id);
    setEditingUserId(null);
    setEditingPrefsUserId(null);
    setDetailsDraft({
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl || '',
    });
    setDetailsWorkLocationDraft(user.workLocation ?? { county: '', town: '' });
  };

  const handleSaveSecurity = () => {
    if (editingUserId !== null) {
      const updates: Partial<User> = {};
      if (newPassword.trim()) updates.password = newPassword;
      if (newPin.trim()) updates.pinNumber = newPin;
      
      onUpdateUser(editingUserId, updates);
      setEditingUserId(null);
      setNewPassword('');
      setNewPin('');
    }
  };

  const handleSaveDetails = () => {
    if (editingDetailsUserId == null) return;
    const trimmedName = detailsDraft.name.trim();
    const trimmedUsername = detailsDraft.username.trim();
    if (!trimmedName || !trimmedUsername) {
      alert('Name and username are required.');
      return;
    }

    const usernameTaken = users.some(
      user =>
        user.id !== editingDetailsUserId &&
        user.username.trim().toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (usernameTaken) {
      alert('That username is already in use. Please choose a different one.');
      return;
    }

    onUpdateUser(editingDetailsUserId, {
      name: trimmedName,
      username: trimmedUsername,
      avatarUrl: detailsDraft.avatarUrl.trim() || undefined,
      workLocation:
        detailsWorkLocationDraft.county && detailsWorkLocationDraft.town
          ? detailsWorkLocationDraft
          : undefined,
    });
    setEditingDetailsUserId(null);
  };

  const handleTogglePrefs = (user: User) => {
    setEditingPrefsUserId(editingPrefsUserId === user.id ? null : user.id);
    setEditingUserId(null);
  };

  const handlePrefChange = (userId: number, currentPrefs: UserPreferences | undefined, field: keyof UserPreferences, value: any) => {
    const defaultPrefs: UserPreferences = {
      theme: 'dark',
      notificationsEnabled: true,
      defaultPage: Page.Dashboard
    };
    const updatedPrefs = { ...(currentPrefs || defaultPrefs), [field]: value };
    onUpdateUser(userId, { preferences: updatedPrefs });
  };

  const handleRoleChange = (userId: number, newRole: User['role']) => {
    onUpdateUser(userId, { role: newRole });
  };

  const handleActivationToggle = (userId: number, currentActive: boolean) => {
    const confirmMsg = !currentActive ? 'Activate this account?' : 'Deactivate this account? User will no longer be able to log in.';
    if (window.confirm(confirmMsg)) {
        onUpdateUser(userId, { isActive: !currentActive });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    const confirmed = window.confirm(
      `Delete user "${user.name}" (@${user.username})?\n\nThis will remove their account details permanently.`
    );
    if (!confirmed) return;
    onDeleteUser(user.id);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      alert('Name, username, and password are required.');
      return;
    }
    onAddUser({
      ...newUser,
      workLocation:
        newUserWorkLocation.county && newUserWorkLocation.town ? newUserWorkLocation : undefined,
    });
    setShowCreateModal(false);
    setNewUser({ name: '', username: '', password: '', pinNumber: '1234', role: 'Sales Representative' });
    setNewUserWorkLocation({ county: '', town: '' });
  };

  useEffect(() => {
    if (editingPrefsUserId == null) return;
    const u = users.find(x => x.id === editingPrefsUserId);
    setTerritoryDraft(u?.workLocation ?? { county: '', town: '' });
  }, [editingPrefsUserId]);

  useEffect(() => {
    if (appNameInputRef.current) appNameInputRef.current.value = branding.appName;
    if (logoUrlInputRef.current) logoUrlInputRef.current.value = branding.logoUrl || '';
  }, [branding]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaveBranding = () => {
    const appNameValue = appNameInputRef.current?.value?.trim() || '';
    const logoUrlValue = logoUrlInputRef.current?.value?.trim() || undefined;
    onUpdateBranding({
      appName: appNameValue,
      logoUrl: logoUrlValue,
    });
    alert('Branding saved.');
  };

  const handleResetBranding = () => {
    const resetBranding: AppBranding = { appName: DEFAULT_APP_NAME };
    if (appNameInputRef.current) appNameInputRef.current.value = resetBranding.appName;
    if (logoUrlInputRef.current) logoUrlInputRef.current.value = '';
    onUpdateBranding(resetBranding);
    alert('Branding reset to default.');
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      event.target.value = '';
      return;
    }

    const maxFileSize = 2 * 1024 * 1024;
    if (file.size > maxFileSize) {
      alert('Logo image is too large. Please choose an image under 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        alert('Could not read the selected image. Please try a different file.');
        return;
      }
      if (logoUrlInputRef.current) {
        logoUrlInputRef.current.value = dataUrl;
      }
    };
    reader.onerror = () => {
      alert('Could not import the selected image.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'In' ? user.isClockedIn : !user.isClockedIn);

      const isActive = user.isActive !== false;
      const matchesAccount = accountFilter === 'All' || 
        (accountFilter === 'Active' ? isActive : !isActive);
      
      return matchesSearch && matchesRole && matchesStatus && matchesAccount;
    });

    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortConfig.key) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        case 'status':
          aVal = a.isClockedIn ? 1 : 0;
          bVal = b.isClockedIn ? 1 : 0;
          break;
        case 'account':
          aVal = a.isActive !== false ? 1 : 0;
          bVal = b.isActive !== false ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, accountFilter, sortConfig]);

  if (currentUser.role !== 'Admin') {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center space-y-4">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <WarningIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
            <p className="max-w-md text-gray-600 dark:text-gray-400">
                You do not have the required permissions to access the User Management portal. Please contact your system administrator.
            </p>
        </div>
    );
  }

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <span className="ml-1 opacity-20 text-[10px]">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-yellow-500">↑</span> : <span className="ml-1 text-yellow-500">↓</span>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
                Create User
            </button>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">App Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">App Name</label>
              <input
                ref={appNameInputRef}
                defaultValue={branding.appName}
                placeholder="Leave blank to reset default"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Logo URL</label>
              <input
                ref={logoUrlInputRef}
                defaultValue={branding.logoUrl || ''}
                placeholder="Leave blank to remove custom logo"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Import Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md bg-white focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-2 file:rounded file:border-0 file:bg-yellow-500 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-blue-900 hover:file:bg-yellow-400"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Image only, max 2MB.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBranding}
                className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 rounded-md hover:bg-yellow-400"
              >
                Save Branding
              </button>
              <button
                onClick={handleResetBranding}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Search Team</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sales Representative">Sales Rep</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Shift Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="In">Clocked In</option>
              <option value="Out">Offline</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Account Status</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="All">All Accounts</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  onClick={() => requestSort('name')}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center">
                    User {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('role')}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center">
                    Role {getSortIcon('role')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Territory (Kenya)
                </th>
                <th 
                  onClick={() => requestSort('status')}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center">
                    Shift {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('account')}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center">
                    Account {getSortIcon('account')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedUsers.length > 0 ? filteredAndSortedUsers.map(user => {
                const isActive = user.isActive !== false;
                const showPrefs = editingPrefsUserId === user.id;
                const prefs = user.preferences || { theme: 'dark', notificationsEnabled: true, defaultPage: Page.Dashboard };
                
                return (
                  <React.Fragment key={user.id}>
                  <tr className={`transition-colors ${!isActive ? 'bg-gray-50 dark:bg-gray-900/40 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          className={`h-10 w-10 rounded-full object-cover mr-3 border-2 shadow-sm ${!isActive ? 'border-gray-400 grayscale' : 'border-yellow-500'}`} 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                          alt={user.name} 
                        />
                        <div>
                          <div className={`text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username} {user.id === currentUser.id && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded ml-1">YOU</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={user.role} 
                        disabled={!isActive || user.id === currentUser.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                        className={`text-xs font-bold px-2 py-1 rounded-full border bg-transparent focus:ring-1 focus:ring-yellow-500 outline-none ${
                            user.role === 'Admin' 
                            ? 'text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                            : 'text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Sales Representative">Sales Rep</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 max-w-[11rem]">
                      {user.workLocation?.town && user.workLocation?.county ? (
                        <span className="line-clamp-2" title={`${user.workLocation.addressLine ? user.workLocation.addressLine + ' · ' : ''}${user.workLocation.town}, ${user.workLocation.county}`}>
                          {user.workLocation.town}, {user.workLocation.county}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center text-xs font-medium ${user.isClockedIn ? 'text-green-500' : 'text-gray-400'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${user.isClockedIn ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} />
                        {user.isClockedIn ? 'Clocked In' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <button
                            onClick={() => handleActivationToggle(user.id, isActive)}
                            disabled={user.id === currentUser.id}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all shadow-sm ${
                                isActive 
                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-red-900/30 dark:hover:text-red-300' 
                                : 'bg-gray-200 text-gray-700 hover:bg-green-100 hover:text-green-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isActive ? 'Active' : 'Disabled'}
                        </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                            onClick={() => handleTogglePrefs(user)}
                            className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${showPrefs ? 'text-yellow-600' : 'text-gray-400'}`}
                            title="Individual Settings"
                        >
                            <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        
                        {editingUserId === user.id ? (
                            <div className="flex items-center space-x-2">
                                <div className="flex flex-col space-y-2">
                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        placeholder="New PIN (4 digits)"
                                        maxLength={4}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        className="px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none font-mono"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <button onClick={handleSaveSecurity} className="text-green-600 hover:text-green-900 font-bold px-2 text-xs">Save</button>
                                    <button onClick={() => setEditingUserId(null)} className="text-gray-400 hover:text-gray-600 px-2 text-xs">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEditDetailsClick(user)}
                                className="flex items-center group text-blue-600 hover:text-blue-700"
                                title="Edit name, username, territory and avatar"
                              >
                                <PencilSquareIcon className="w-4 h-4 mr-1 transition-transform group-hover:scale-110" />
                                <span className="font-bold">Details</span>
                              </button>
                              <button 
                                onClick={() => handleUpdateClick(user)}
                                disabled={!isActive}
                                className={`flex items-center group ${!isActive ? 'text-gray-400 cursor-not-allowed' : 'text-yellow-600 hover:text-yellow-700'}`}
                                title="Update Password/PIN"
                              >
                                <PencilSquareIcon className={`w-4 h-4 mr-1 transition-transform ${isActive ? 'group-hover:scale-110' : ''}`} />
                                <span className="font-bold">Security</span>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={user.id === currentUser.id}
                                className={`font-bold ${user.id === currentUser.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                                title={user.id === currentUser.id ? 'Cannot delete your own account' : 'Delete user'}
                              >
                                Delete
                              </button>
                            </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingDetailsUserId === user.id && (
                    <tr className="bg-gray-50 dark:bg-gray-900/30">
                      <td colSpan={6} className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                            <input
                              value={detailsDraft.name}
                              onChange={e => setDetailsDraft(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input
                              value={detailsDraft.username}
                              onChange={e => setDetailsDraft(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avatar URL (optional)</label>
                            <input
                              value={detailsDraft.avatarUrl}
                              onChange={e => setDetailsDraft(prev => ({ ...prev, avatarUrl: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Territory</label>
                            <WorkLocationPicker
                              idPrefix={`edit-user-wl-${user.id}`}
                              value={detailsWorkLocationDraft}
                              onChange={setDetailsWorkLocationDraft}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            onClick={() => setEditingDetailsUserId(null)}
                            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveDetails}
                            className="px-4 py-2 text-xs font-bold text-blue-900 bg-yellow-500 rounded-md hover:bg-yellow-400"
                          >
                            Save Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {showPrefs && (
                    <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                        <td colSpan={6} className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Theme Preference</label>
                                    <div className="flex gap-2">
                                        {['light', 'dark', 'system'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => handlePrefChange(user.id, user.preferences, 'theme', t)}
                                                className={`flex-1 py-1 text-[10px] font-bold rounded uppercase border transition-all ${
                                                    prefs.theme === t 
                                                    ? 'bg-yellow-500 text-blue-900 border-yellow-600' 
                                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notifications</label>
                                    <button
                                        onClick={() => handlePrefChange(user.id, user.preferences, 'notificationsEnabled', !prefs.notificationsEnabled)}
                                        className={`flex items-center px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                            prefs.notificationsEnabled 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-red-100 text-red-700 border-red-200'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full mr-2 ${prefs.notificationsEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {prefs.notificationsEnabled ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Default Home View</label>
                                    <select
                                        value={prefs.defaultPage}
                                        onChange={(e) => handlePrefChange(user.id, user.preferences, 'defaultPage', e.target.value as Page)}
                                        className="w-full px-2 py-1 text-[10px] font-bold border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 outline-none focus:ring-1 focus:ring-yellow-500"
                                    >
                                        <option value={Page.Dashboard}>Dashboard</option>
                                        <option value={Page.Products}>Products</option>
                                        <option value={Page.Orders}>Orders</option>
                                        <option value={Page.Clients}>Clients</option>
                                        <option value={Page.Tasks}>Tasks</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-blue-200/60 dark:border-blue-800/40">
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Territory — county, town &amp; optional street
                              </label>
                              <WorkLocationPicker
                                idPrefix={`um-wl-${user.id}`}
                                value={territoryDraft}
                                onChange={setTerritoryDraft}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingPrefsUserId == null) return;
                                  onUpdateUser(editingPrefsUserId, {
                                    workLocation:
                                      territoryDraft.county && territoryDraft.town ? territoryDraft : undefined,
                                  });
                                }}
                                className="mt-3 px-3 py-1.5 text-xs font-bold rounded-md bg-yellow-500 text-blue-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              >
                                Save territory
                              </button>
                            </div>
                        </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                    No users match your current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-hidden animate-in zoom-in duration-200">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Team Member</h3>
                      <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          <CloseIcon className="w-6 h-6" />
                      </button>
                  </div>
                  <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                          <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Password</label>
                              <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial PIN</label>
                              <input
                                type="text"
                                maxLength={4}
                                value={newUser.pinNumber}
                                onChange={(e) => setNewUser({...newUser, pinNumber: e.target.value.replace(/\D/g, '')})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                placeholder="1234"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as User['role']})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                              <option value="Sales Representative">Sales Representative</option>
                              <option value="Admin">Admin</option>
                          </select>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Primary territory (optional)
                          </label>
                          <WorkLocationPicker
                            idPrefix="new-user-wl"
                            value={newUserWorkLocation}
                            onChange={setNewUserWorkLocation}
                          />
                      </div>
                      <div className="pt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            Add Member
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
