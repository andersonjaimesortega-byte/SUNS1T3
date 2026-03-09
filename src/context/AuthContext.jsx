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
            console.log('Attempting to sync with Supabase...');
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            if (data) {
                console.log('Sync successful, users found:', data.length);
                setUsersList(data);
                localStorage.setItem('cached_users', JSON.stringify(data));
                return data;
            }
        } catch (error) {
            console.error('Supabase sync failed:', error.message);
            const cached = localStorage.getItem('cached_users');
            if (cached) {
                console.log('Using cached users from localStorage');
                const list = JSON.parse(cached);
                setUsersList(list);
                return list;
            } else {
                console.log('No cache found, using local JSON fallback:', localUsers);
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
            await syncUsers(); // Forces a refresh of the users list on load
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

        // Intenta buscar en Supabase list primero
        let foundUser = usersList.find(u => u.id === cleanId);
        let source = 'Supabase/Cache';

        // Si no está, forzar una actualización directa desde Supabase por si es un usuario recién creado
        if (!foundUser) {
            console.log(`ID ${cleanId} not found in cache. Forcing fresh sync with Supabase...`);
            const freshUsers = await syncUsers();
            if (freshUsers) {
                foundUser = freshUsers.find(u => u.id === cleanId);
                if (foundUser) source = 'Live Supabase Fetch';
            }
        }

        if (!foundUser) {
            console.warn(`ID ${cleanId} not found in usersList. Checking local JSON fallback manually...`);
            foundUser = localUsers.find(u => u.id === cleanId);
            if (foundUser) {
                source = 'Local JSON Override';
                console.log('User found in local JSON fallback.');
            }
        }

        if (foundUser) {
            console.log(`Login successful for: ${foundUser.nombre} (Source: ${source})`);

            let finalUser = { ...foundUser };
            // Asegurarse de que rol_sistema exista.
            if (!finalUser.rol_sistema) {
                const localMatch = localUsers.find(u => u.id === cleanId);
                if (localMatch && localMatch.rol_sistema) {
                    finalUser.rol_sistema = localMatch.rol_sistema;
                    console.log('Merged local role:', finalUser.rol_sistema);
                } else {
                    finalUser.rol_sistema = 'residente';
                    console.log('Applied default role: residente');
                }
            } else {
                console.log('Role from DB exists:', finalUser.rol_sistema);
            }

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
