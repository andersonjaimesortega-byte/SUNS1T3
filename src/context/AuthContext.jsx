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
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            if (data) {
                setUsersList(data);
                localStorage.setItem('cached_users', JSON.stringify(data));
                return data;
            }
        } catch (error) {
            console.warn('Sync failed, using cache:', error.message);
            const cached = localStorage.getItem('cached_users');
            const list = cached ? JSON.parse(cached) : localUsers;
            setUsersList(list);
            return list;
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
        const foundUser = usersList.find(u => u.id === userId);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('minigranja_user', JSON.stringify(foundUser));
            return { success: true };
        }
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
