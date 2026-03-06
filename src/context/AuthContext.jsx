import React, { createContext, useContext, useState, useEffect } from 'react';
import usersData from '../data/users.json';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('minigranja_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (userId) => {
        const foundUser = usersData.find(u => u.id === userId);
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
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
