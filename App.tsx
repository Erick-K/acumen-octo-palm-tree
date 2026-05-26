import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, Client, Product, Order, OrderItem, Task, ClockLog, UserPreferences, LiveLocation } from './types';
import { Page } from './types';
import { MOCK_CLIENTS, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_USERS, MOCK_TASKS } from './data/mockData';
import { loadSharedAppState, mergeSharedAppData, saveSharedAppState, type SharedAppData } from './lib/sharedAppState';
import { useGeolocation } from './hooks/useGeolocation';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Orders } from './components/Orders';
import { Clients } from './components/Clients';
import { Tasks } from './components/Tasks';
import { UserProfile } from './components/UserProfile';
import { Header } from './components/Header';
import { UserManagement } from './components/UserManagement';

const pageTitles: { [key in Page]: string } = {
    [Page.Dashboard]: 'Dashboard',
    [Page.Products]: 'Products',
    [Page.Orders]: 'Orders',
    [Page.Clients]: 'My Clients',
    [Page.Tasks]: 'Tasks',
    [Page.Profile]: 'User Profile',
    [Page.Users]: 'User Management',
};

type ImportedClientData = Omit<Client, 'location' | 'visits'> & { address: string };

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sharedStateReady, setSharedStateReady] = useState(false);
  const lastSharedUpdatedAtRef = useRef<string | null>(null);
  const lastLiveLocationSavedAtRef = useRef(0);
  
  // App-level state for data, with persistence
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('users');
      const parsed = saved ? JSON.parse(saved) : MOCK_USERS;
      const base = Array.isArray(parsed) ? parsed : MOCK_USERS;
      return base.map((u: User) => {
        if (u.workLocation?.county && u.workLocation?.town) return u;
        const fromMock = MOCK_USERS.find(m => m.id === u.id);
        return fromMock?.workLocation ? { ...u, workLocation: fromMock.workLocation } : u;
      });
    } catch (e) {
      return MOCK_USERS;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const savedClients = localStorage.getItem('clients');
      return savedClients ? JSON.parse(savedClients) : MOCK_CLIENTS;
    } catch (error) {
      console.error("Failed to parse clients from localStorage", error);
      return MOCK_CLIENTS;
    }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('products');
      return savedProducts ? JSON.parse(savedProducts) : MOCK_PRODUCTS;
    } catch (error) {
      console.error("Failed to parse products from localStorage", error);
      return MOCK_PRODUCTS;
    }
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      return savedOrders ? JSON.parse(savedOrders) : MOCK_ORDERS;
    } catch (error) {
      console.error("Failed to parse orders from localStorage", error);
      return MOCK_ORDERS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : MOCK_TASKS;
    } catch (error) {
      console.error("Failed to parse tasks from localStorage", error);
      return MOCK_TASKS;
    }
  });

  const [clockLogs, setClockLogs] = useState<ClockLog[]>(() => {
    try {
        const saved = localStorage.getItem('clockLogs');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>(() => {
    try {
        const saved = localStorage.getItem('liveLocations');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });
  const shouldTrackLiveLocation = Boolean(currentUser?.isClockedIn);
  const { position: livePosition, error: liveLocationError } = useGeolocation(shouldTrackLiveLocation, { watch: true });

  const applySharedData = useCallback((data: SharedAppData) => {
    setUsers(data.users);
    setClients(data.clients);
    setProducts(data.products);
    setOrders(data.orders);
    setTasks(data.tasks);
    setClockLogs(data.clockLogs);
    setLiveLocations(data.liveLocations);
    setCurrentUser(prev => {
      if (!prev) return prev;
      const nextUser = data.users.find(u => u.id === prev.id);
      return nextUser ?? prev;
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event: MediaQueryListEvent) => setIsSystemDark(event.matches);
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const isDarkMode = themePreference === 'dark' || (themePreference === 'system' && isSystemDark);

  // Handle Theme Logic
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('clients', JSON.stringify(clients));
      localStorage.setItem('products', JSON.stringify(products));
      localStorage.setItem('orders', JSON.stringify(orders));
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('clockLogs', JSON.stringify(clockLogs));
      localStorage.setItem('liveLocations', JSON.stringify(liveLocations));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [users, clients, products, orders, tasks, clockLogs, liveLocations]);

  useEffect(() => {
    let cancelled = false;

    loadSharedAppState()
      .then(payload => {
        if (cancelled || !payload?.data) return;
        lastSharedUpdatedAtRef.current = payload.updatedAt;
        const localData: SharedAppData = { users, clients, products, orders, tasks, clockLogs, liveLocations };
        applySharedData(mergeSharedAppData(localData, payload.data));
      })
      .catch(error => {
        console.warn('Shared app data is unavailable; using local device data.', error);
      })
      .finally(() => {
        if (!cancelled) setSharedStateReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [applySharedData]);

  useEffect(() => {
    if (!sharedStateReady) return;

    const data: SharedAppData = { users, clients, products, orders, tasks, clockLogs, liveLocations };
    const timeout = window.setTimeout(() => {
      saveSharedAppState(data)
        .then(payload => {
          if (payload?.updatedAt) {
            lastSharedUpdatedAtRef.current = payload.updatedAt;
          }
        })
        .catch(error => {
          console.warn('Failed to save shared app data; local device data is still saved.', error);
        });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [sharedStateReady, users, clients, products, orders, tasks, clockLogs, liveLocations]);

  useEffect(() => {
    if (!sharedStateReady) return;

    const interval = window.setInterval(() => {
      loadSharedAppState()
        .then(payload => {
          if (!payload?.data || !payload.updatedAt) return;
          if (payload.updatedAt === lastSharedUpdatedAtRef.current) return;
          lastSharedUpdatedAtRef.current = payload.updatedAt;
          applySharedData(payload.data);
        })
        .catch(() => {
          // Keep the app usable offline or when the Netlify function is unavailable.
        });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [sharedStateReady, applySharedData]);

  useEffect(() => {
    if (!currentUser?.isClockedIn || !livePosition) return;

    const now = Date.now();
    const nextLocation: LiveLocation = {
      userId: currentUser.id,
      lat: livePosition.coords.latitude,
      lng: livePosition.coords.longitude,
      accuracy: livePosition.coords.accuracy,
      timestamp: new Date(now).toISOString(),
      isActive: true,
    };

    setLiveLocations(prev => {
      const existing = prev.find(location => location.userId === currentUser.id);
      if (
        existing &&
        existing.lat === nextLocation.lat &&
        existing.lng === nextLocation.lng &&
        existing.accuracy === nextLocation.accuracy &&
        now - lastLiveLocationSavedAtRef.current < 30000
      ) {
        return prev;
      }

      lastLiveLocationSavedAtRef.current = now;
      return [
        nextLocation,
        ...prev.filter(location => location.userId !== currentUser.id),
      ];
    });
  }, [currentUser?.id, currentUser?.isClockedIn, livePosition]);

  useEffect(() => {
    if (!liveLocationError || !currentUser?.isClockedIn) return;
    console.warn('Live location tracking failed.', liveLocationError.message);
  }, [currentUser?.isClockedIn, liveLocationError]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'products' || !event.newValue) return;
      try {
        const nextProducts = JSON.parse(event.newValue);
        if (Array.isArray(nextProducts)) {
          setProducts(nextProducts);
        }
      } catch (error) {
        console.error("Failed to sync products from localStorage", error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  const handleLogin = (user: User) => {
    const matchedUser = users.find(u => u.username === user.username && u.password === user.password);
    if (matchedUser) {
        if (matchedUser.isActive === false) return;
        setCurrentUser(matchedUser);
        setThemePreference(matchedUser.preferences?.theme ?? 'system');
        if (matchedUser.preferences?.defaultPage) {
            setCurrentPage(matchedUser.preferences.defaultPage);
        } else {
            setCurrentPage(Page.Dashboard);
        }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleToggleClock = () => {
      if (!currentUser) return;
      
      const newType = currentUser.isClockedIn ? 'out' : 'in';
      const newLog: ClockLog = {
          id: `log-${Date.now()}`,
          userId: currentUser.id,
          type: newType,
          timestamp: new Date().toISOString()
      };

      setClockLogs(prev => [newLog, ...prev]);
      
      const updatedUser = { ...currentUser, isClockedIn: !currentUser.isClockedIn };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      if (newType === 'out') {
        setLiveLocations(prev => {
          const existing = prev.find(location => location.userId === currentUser.id);
          if (!existing) return prev;

          return [
            {
              ...existing,
              isActive: false,
              timestamp: newLog.timestamp,
            },
            ...prev.filter(location => location.userId !== currentUser.id),
          ];
        });
      }
  };

  const handleUpdateUserProfile = (updatedData: Partial<User>) => {
      if (currentUser) {
          const updatedUser = { ...currentUser, ...updatedData };
          setCurrentUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
          if (updatedData.preferences?.theme) {
            setThemePreference(updatedData.preferences.theme);
          }
      }
  };

  const handleUpdateTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    if (currentUser) {
      const defaultPrefs: UserPreferences = {
        theme: 'system',
        notificationsEnabled: true,
        defaultPage: Page.Dashboard
      };
      const updatedPrefs = { ...(currentUser.preferences || defaultPrefs), theme };
      handleUpdateUserProfile({ preferences: updatedPrefs });
    }
  };

  const handleUpdateUser = (userId: number, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    
    if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
        if (updatedData.isActive === false) {
            handleLogout();
        }
    }
  };

  const handleAddUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
        ...newUserData,
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        isActive: true,
        isClockedIn: false,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUserPassword = (userId: number, newPassword: string) => {
      handleUpdateUser(userId, { password: newPassword });
  };
  
  const handlePlaceOrder = (newOrderData: { clientId: number; items: OrderItem[]; total: number; salesRepId: number; date: string; isPaid?: boolean }) => {
    const newOrder: Order = {
      ...newOrderData,
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      status: 'Pending',
      isPaid: newOrderData.isPaid ?? false,
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);

    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      newOrder.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex].stock -= item.quantity;
        }
      });
      return updatedProducts;
    });

    return newOrder;
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const originalOrder = orders.find(o => o.id === updatedOrder.id);
    if (!originalOrder) return;

    setProducts(currentProducts => {
        const productsMap = new Map<number, Product>(currentProducts.map(p => [p.id, p]));
        originalOrder.items.forEach(item => {
            const p = productsMap.get(item.productId);
            if (p) productsMap.set(p.id, { ...p, stock: p.stock + item.quantity });
        });
        updatedOrder.items.forEach(item => {
             const p = productsMap.get(item.productId);
             if (p) productsMap.set(p.id, { ...p, stock: p.stock - item.quantity });
        });
        return Array.from(productsMap.values()).sort((a, b) => a.id - b.id);
    });

    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleAddClientVisit = (clientId: number, notes: string) => {
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;
      const updatedClient = { ...prevClients[clientIndex] };
      const newVisit = {
        id: `visit-${Date.now()}`,
        date: new Date().toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      };
      updatedClient.visits = [newVisit, ...(updatedClient.visits || [])];
      const newClients = [...prevClients];
      newClients[clientIndex] = updatedClient;
      return newClients;
    });
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prevClients => 
      prevClients.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
  };

  const handleAddClient = (newClientData: Omit<Client, 'id' | 'location' | 'visits'> & { address: string }) => {
    const newClient: Client = {
      ...newClientData,
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 101,
      location: {
        lat: -1.286389,
        lng: 36.817223,
        address: newClientData.address,
      },
      visits: [],
    };
    setClients(prevClients => [newClient, ...prevClients]);
  };

    const handleImportClients = (importedClientsData: ImportedClientData[]) => {
        setClients(currentClients => {
            const clientsMap = new Map<number, Client>(currentClients.map(c => [c.id, c]));
            importedClientsData.forEach(imported => {
                if (imported && typeof imported.id === 'number') {
                    const existingClient = clientsMap.get(imported.id);
                    if (existingClient) {
                        const updatedClient: Client = {
                            ...existingClient,
                            ...imported,
                            location: { ...existingClient.location, address: imported.address },
                        };
                        clientsMap.set(imported.id, updatedClient);
                    } else {
                        const newClient: Client = {
                            ...imported,
                            location: { lat: -1.286389, lng: 36.817223, address: imported.address },
                            visits: [],
                        };
                        clientsMap.set(imported.id, newClient);
                    }
                }
            });
            return Array.from(clientsMap.values()).sort((a, b) => a.id - b.id);
        });
    };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
        ...newProductData,
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    };
    setProducts(prevProducts => [newProduct, ...prevProducts]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts(currentProducts => {
      const productsMap = new Map<number, Product>(currentProducts.map(p => [p.id, p]));
      const seenImportedIds = new Set<number>();
      let nextGeneratedId = Math.max(0, ...currentProducts.map(p => p.id), ...importedProducts.map(p => p.id));
      const normalizedImportedProducts = importedProducts.map(product => {
        if (!seenImportedIds.has(product.id)) {
          seenImportedIds.add(product.id);
          return product;
        }

        const nextProduct = { ...product, id: ++nextGeneratedId };
        seenImportedIds.add(nextProduct.id);
        return nextProduct;
      });

      normalizedImportedProducts.forEach(p => {
        if (p && typeof p.id === 'number') {
            productsMap.set(p.id, p);
        }
      });
      const importedIds = new Set(normalizedImportedProducts.map(p => p.id));
      return Array.from(productsMap.values()).sort((a, b) => {
        const aImported = importedIds.has(a.id);
        const bImported = importedIds.has(b.id);
        if (aImported !== bImported) return aImported ? -1 : 1;
        return b.id - a.id;
      });
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      status: 'To-do',
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  };

  const salesReps = useMemo(() => users.filter(u => u.role === 'Sales Representative'), [users]);

  const userClients = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return clients;
    return clients.filter(c => c.salesRepId === currentUser.id);
  }, [currentUser, clients]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return orders;
    return orders.filter(o => o.salesRepId === currentUser.id);
  }, [currentUser, orders]);

  const userTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return tasks;
    return tasks.filter(t => t.assignedToId === currentUser.id);
  }, [currentUser, tasks]);

  const userClockLogs = useMemo(() => {
    if (!currentUser) return [];
    return clockLogs.filter(log => log.userId === currentUser.id);
  }, [currentUser, clockLogs]);

  const getPageTitle = () => {
    if (!currentUser) return '';
    if (currentPage === Page.Clients && currentUser.role === 'Admin') return 'All Clients';
    return pageTitles[currentPage];
  };

  const renderPage = () => {
    if (!currentUser) return null;

    switch (currentPage) {
      case Page.Dashboard:
        return <Dashboard 
            clients={userClients} 
            products={products} 
            orders={userOrders} 
            tasks={userTasks} 
            isClockedIn={currentUser.isClockedIn}
            lastClockLog={userClockLogs[0]}
            users={users}
            liveLocations={currentUser.role === 'Admin' ? liveLocations : []}
        />;
      case Page.Products:
        return <Products 
            products={products} 
            onUpdateProduct={handleUpdateProduct} 
            onAddProduct={handleAddProduct} 
            onImportProducts={handleImportProducts}
            userRole={currentUser.role} 
        />;
      case Page.Orders:
        return <Orders 
            orders={userOrders} 
            clients={userClients} 
            products={products} 
            salesRepId={currentUser.id}
            salesReps={users}
            onPlaceOrder={handlePlaceOrder}
            onUpdateOrder={handleUpdateOrder} 
            onDeleteOrder={handleDeleteOrder} 
        />;
      case Page.Clients:
        return <Clients 
            clients={userClients}
            orders={userOrders}
            salesReps={salesReps} 
            onAddVisit={handleAddClientVisit} 
            onUpdateClient={handleUpdateClient} 
            // Corrected: pass handleAddClient instead of handleUpdateClient to onAddClient prop
            onAddClient={handleAddClient} 
            onImportClients={handleImportClients}
            userRole={currentUser.role} 
            currentUserId={currentUser.id} />;
      case Page.Tasks:
        return <Tasks 
            tasks={userTasks}
            salesReps={users}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            userRole={currentUser.role}
            currentUserId={currentUser.id}
        />;
      case Page.Users:
          return <UserManagement 
            users={users} 
            currentUser={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onAddUser={handleAddUser}
          />;
      case Page.Profile:
          return <UserProfile user={currentUser} onUpdateUser={handleUpdateUserProfile} clockLogs={userClockLogs} />;
      default:
        return <Dashboard clients={userClients} products={products} orders={userOrders} tasks={userTasks} users={users} liveLocations={currentUser.role === 'Admin' ? liveLocations : []} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} flex h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 text-gray-800 dark:text-gray-200`}>
      <Sidebar 
        user={currentUser} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
      />
      <main className="flex-1 flex flex-col w-full lg:ml-64">
        <Header 
            title={getPageTitle()}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            user={currentUser}
            themePreference={themePreference}
            onToggleClock={handleToggleClock}
            lastClockLog={userClockLogs[0]}
            onUpdateTheme={handleUpdateTheme}
        />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </main>
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"></div>}
    </div>
  );
};

export default App;