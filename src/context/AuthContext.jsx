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
                setUser(JSON.parse(savedUser));
            }
            await syncUsers();
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

    const login = (userId) => {
        const cleanId = userId.trim().toUpperCase();
        console.log('Attempting login with ID:', cleanId);
        console.log('Available users in current list:', usersList.map(u => u.id));

        const foundUser = usersList.find(u => u.id === cleanId);

        if (foundUser) {
            console.log('Login successful for:', foundUser.nombre);
            setUser(foundUser);
            localStorage.setItem('minigranja_user', JSON.stringify(foundUser));
            return { success: true };
        }
        console.warn('Login failed: ID not found in current list');
        return { success: false, message: 'ID de usuario no válido' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('minigranja_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, syncUsers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
