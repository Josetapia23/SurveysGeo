import React, { createContext, useContext, useState } from 'react';
import { User } from '../../App';

export interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (user: User) => void;
    logout: () => void;
}

// Crear contexto de usuario
const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook para usar el contexto de usuario
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe usarse dentro de UserProvider');
    }
    return context;
};

// Provider de usuario
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User): void => {
        setUser(userData);
    };

    const logout = (): void => {
        setUser(null);
    };

    const value: UserContextType = {
        user,
        setUser,
        login,
        logout,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};