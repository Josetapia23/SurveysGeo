import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../App';
import { ApiService, StorageService, API_CONFIG, ApiError, LoginResponse } from '../services/api';

export interface UserContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    token: string | null;
    login: (usuario: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
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
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Verificar estado de autenticación al iniciar
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async (): Promise<void> => {
        try {
            setIsLoading(true);
            console.log('🔍 Verificando estado de autenticación...');

            const [storedToken, storedUser] = await Promise.all([
                StorageService.getToken(),
                StorageService.getUser()
            ]);

            if (storedToken && storedUser) {
                console.log('✅ Sesión encontrada en storage');
                setToken(storedToken);
                setUser(storedUser);
                setIsAuthenticated(true);
            } else {
                console.log('❌ No hay sesión guardada');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            // En caso de error, limpiar todo
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (usuario: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            console.log('🔐 Intentando login...');

            // Llamar a la API de login
            const response = await ApiService.post<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
                usuario,
                password
            });

            if (response.success && response.data) {
                const { token: apiToken, user: apiUser } = response.data;

                // Convertir datos de la API al formato de User
                const userData: User = {
                    id: apiUser.id.toString(),
                    email: apiUser.email || apiUser.usuario,
                    name: `${apiUser.nombres} ${apiUser.apellidos}`.trim(),
                    role: 'gestor' as const
                };

                // Guardar en storage
                await Promise.all([
                    StorageService.saveToken(apiToken),
                    StorageService.saveUser(userData)
                ]);

                // Actualizar estado
                setToken(apiToken);
                setUser(userData);
                setIsAuthenticated(true);

                console.log('✅ Login exitoso:', userData.name);
            } else {
                throw new Error(response.message || 'Error en login');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);

            // Limpiar estado en caso de error
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);

            // Re-lanzar el error para que el componente lo maneje
            if (error as ApiError) {
                const apiError = error as ApiError;
                throw new Error(apiError.message || 'Error de conexión');
            } else {
                throw new Error('Error inesperado durante el login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            console.log('🚪 Cerrando sesión...');

            // Limpiar storage
            await StorageService.clearAll();

            // Limpiar estado
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);

            console.log('✅ Sesión cerrada');
        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);

            // Aún así limpiar el estado local
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const value: UserContextType = {
        user,
        isLoading,
        isAuthenticated,
        token,
        login,
        logout,
        checkAuthStatus,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};