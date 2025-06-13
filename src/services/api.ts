// src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de la API
export const API_CONFIG = {
    BASE_URL: 'http://192.168.6.225/surveys-api', // IP de tu Mac para dispositivo móvil
    ENDPOINTS: {
        LOGIN: '/auth/login',
        LIDERES: '/v1/lideres/',
        ENCUESTAS: '/v1/encuestas/',
        GESTORES_ME: '/v1/gestores/me'
    },
    STORAGE_KEYS: {
        TOKEN: '@surveysGeo_token',
        USER: '@surveysGeo_user'
    }
};

// Tipos específicos para respuestas de login
export interface LoginResponse {
    token: string;
    user: {
        id: number;
        nombres: string;
        apellidos: string;
        documento: number;
        telefono: string;
        email: string;
        usuario: string;
        perfil: string;
    };
    expires_in: number;
    token_type: string;
}

// Tipos específicos para líderes
export interface LiderResponse {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    celular: string;
    direccion: string;
    barrio: string;
    municipio_residencia: string;
    municipio_operacion: string;
    status: 'pendiente' | 'visitado';
    fecha_encuesta: string | null;
    grupo: string;
    meta: number;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

// Tipos específicos para encuestas
export interface EncuestaResponse {
    encuesta_id: string;
    lider: {
        id: number;
        nombres: string;
        apellidos: string;
    };
    respuestas: {
        pregunta1: string;
        pregunta2: string;
        pregunta3: string;
    };
    ubicacion: string;
    fecha_hora: string;
}

// Tipo para respuestas de la API
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error_details?: any;
    timestamp: string;
    version: string;
}

// Tipo para errores de la API
export interface ApiError {
    message: string;
    status: number;
    details?: any;
}

// Clase para manejar requests HTTP
export class ApiService {
    private static async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error obteniendo token:', error);
            return null;
        }
    }

    private static async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            
            // Headers por defecto
            const defaultHeaders: HeadersInit = {
                'Content-Type': 'application/json',
            };

            // Agregar token si existe y no es el endpoint de login
            if (endpoint !== API_CONFIG.ENDPOINTS.LOGIN) {
                const token = await this.getToken();
                if (token) {
                    defaultHeaders.Authorization = `Bearer ${token}`;
                }
            }

            // Combinar headers
            const headers = {
                ...defaultHeaders,
                ...options.headers,
            };

            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data: ApiResponse<T> = await response.json();

            console.log(`📡 API Response [${response.status}]:`, data);

            if (!response.ok) {
                throw {
                    message: data.message || 'Error en la solicitud',
                    status: response.status,
                    details: data.error_details
                } as ApiError;
            }

            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            
            // Si es un error de red
            if (error instanceof TypeError) {
                throw {
                    message: 'Error de conexión. Verifica tu internet.',
                    status: 0,
                    details: error.message
                } as ApiError;
            }
            
            // Re-lanzar errores de la API
            throw error;
        }
    }

    // GET request
    static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'GET',
        });
    }

    // POST request
    static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PUT request
    static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // DELETE request
    static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'DELETE',
        });
    }
}

// Funciones de utilidad para el almacenamiento
export const StorageService = {
    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, token);
            console.log('✅ Token guardado');
        } catch (error) {
            console.error('❌ Error guardando token:', error);
        }
    },

    async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
            return token;
        } catch (error) {
            console.error('❌ Error obteniendo token:', error);
            return null;
        }
    },

    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
            console.log('✅ Token eliminado');
        } catch (error) {
            console.error('❌ Error eliminando token:', error);
        }
    },

    async saveUser(user: any): Promise<void> {
        try {
            await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
            console.log('✅ Usuario guardado');
        } catch (error) {
            console.error('❌ Error guardando usuario:', error);
        }
    },

    async getUser(): Promise<any | null> {
        try {
            const userStr = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    },

    async removeUser(): Promise<void> {
        try {
            await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
            console.log('✅ Usuario eliminado');
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await Promise.all([
                this.removeToken(),
                this.removeUser()
            ]);
            console.log('✅ Storage limpiado');
        } catch (error) {
            console.error('❌ Error limpiando storage:', error);
        }
    }
};