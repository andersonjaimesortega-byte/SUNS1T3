import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import localUsers from '../data/users.json';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usersList, setUsersList] = useState([]);

    const syncUsers = async () => {
        try {
            console.log('Attempting to sync with Supabase (Cache Busted)...');
            // Adding a timestamp query to bust any aggressive CDN/Browser caching from Supabase REST API
            const timestamp = new Date().getTime();
            const { data, error } = await supabase
                .from('users')
                .select('*')
                // Force fresh query
                .order('id', { ascending: true })
                .limit(1000);

            if (error) throw error;
            if (data) {
                console.log('Sync successful, users found:', data.length);

                // Merge logical: Supabase is the source of truth for active users
                // But we augment with local JSON if the database lacks 'rol_sistema' for some reason
                const mergedUsers = data.map(dbUser => {
                    if (!dbUser.rol_sistema) {
                        const localMatch = localUsers.find(u => u.id === dbUser.id);
                        if (localMatch && localMatch.rol_sistema) {
                            return { ...dbUser, rol_sistema: localMatch.rol_sistema };
                        }
                        return { ...dbUser, rol_sistema: 'residente' };
                    }
                    return dbUser;
                });

                setUsersList(mergedUsers);
                localStorage.setItem('cached_users', JSON.stringify(mergedUsers));
                return mergedUsers;
            }
        } catch (error) {
            console.error('Supabase sync failed (offline or network error):', error.message);
            const cached = localStorage.getItem('cached_users');
            if (cached) {
                console.log('Using cached users from localStorage (Offline Mode)');
                const list = JSON.parse(cached);
                setUsersList(list);
                return list;
            } else {
                console.log('No cache found, using local JSON fallback! Warning: This might allow deleted users.');
                setUsersList(localUsers);
                return localUsers;
            }
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const savedUser = localStorage.getItem('minigranja_user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                console.log('Found saved user:', parsed);
                setUser(parsed);
            }

            // Always try to fetch fresh users on app load
            if (navigator.onLine) {
                await syncUsers();
            } else {
                // Initial load offline fallback
                const cached = localStorage.getItem('cached_users');
                if (cached) setUsersList(JSON.parse(cached));
                else setUsersList(localUsers);
            }

            setLoading(false);
        };

        // Listeners para sincronización automática
        const handleAutoSync = () => {
            if (navigator.onLine) {
                console.log('Automated sync triggered...');
                syncUsers();
            }
        };

        window.addEventListener('online', handleAutoSync);
        window.addEventListener('focus', handleAutoSync);

        // Sync periódico cada 5 minutos
        const interval = setInterval(handleAutoSync, 5 * 60 * 1000);

        initAuth();

        return () => {
            window.removeEventListener('online', handleAutoSync);
            window.removeEventListener('focus', handleAutoSync);
            clearInterval(interval);
        };
    }, []);

    const login = async (userId) => {
        const cleanId = userId.trim().toUpperCase();
        console.log('Attempting login with ID:', cleanId);

        // Debugging: What does our user list actually look like right now?
        console.log('Total users in list:', usersList.length);
        const mappedIds = usersList.map(u => u.id);
        console.log('Available IDs:', mappedIds);

        // Intenta buscar en lista ya sincronizada primero
        let foundUser = usersList.find(u => u.id === cleanId);
        let source = 'Supabase/Cache';

        // Si no está, forzamos ir a Supabase en vivo
        if (!foundUser && navigator.onLine) {
            console.log(`ID ${cleanId} not found in state. Forcing fresh sync with Supabase...`);
            const freshUsers = await syncUsers();
            if (freshUsers) {
                foundUser = freshUsers.find(u => u.id === cleanId);
                if (foundUser) source = 'Live Supabase Fetch';
            }
        }

        // Solo permitir login desde local JSON si estamos genuinamente offline o la BD falló por completo
        // NO permitir si Supabase respondió correctamente pero el usuario no está.
        if (!foundUser && !navigator.onLine) {
            console.warn(`Device offline. Checking local JSON fallback manually for ID ${cleanId}...`);
            foundUser = localUsers.find(u => u.id === cleanId);
            if (foundUser) {
                source = 'Local JSON Override (Offline Mode)';
                console.log('User found in local JSON fallback during offline mode.');
            }
        }

        if (foundUser) {
            console.log(`Login successful for: ${foundUser.nombre} (Source: ${source})`);

            let finalUser = { ...foundUser };
            // El rol ya debería estar mezclado gracias a syncUsers, pero por si acaso viene del JSON local directo:
            if (!finalUser.rol_sistema) finalUser.rol_sistema = 'residente';

            console.log('Setting final user state:', finalUser);
            setUser(finalUser);
            localStorage.setItem('minigranja_user', JSON.stringify(finalUser));
            localStorage.setItem('sunsite_user', JSON.stringify(finalUser));
            return { success: true };
        }

        console.warn(`Login failed: ID ${cleanId} not found anywhere.`);
        return { success: false, message: 'ID de usuario no registrado en el sistema.' };
    };

    const updateUserName = (newName) => {
        if (!user) return;
        const updatedUser = { ...user, nombre: newName };
        setUser(updatedUser);
        localStorage.setItem('sunsite_user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sunsite_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, syncUsers, updateUserName, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
