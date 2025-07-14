// src/hooks/useProximityValidation.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

// Tipos para el hook
export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface ProximityState {
    userLocation: Coordinates | null;
    isInRange: boolean;
    distance: number | null;
    isLoading: boolean;
    error: string | null;
}

export interface UseProximityValidationReturn extends ProximityState {
    checkProximity: () => Promise<void>;
    minDistance: number;
    refreshLocation: () => Promise<void>;
}

/**
 * Hook personalizado para validar proximidad entre usuario y ubicación objetivo
 * @param targetLocation - Coordenadas del objetivo (líder)
 * @param minDistance - Distancia mínima requerida en metros (default: 80)
 * @param autoRefresh - Si debe refrescar automáticamente (default: false)
 * @param refreshInterval - Intervalo de refresco en ms (default: 10000)
 */
export const useProximityValidation = (
    targetLocation: Coordinates | null,
    minDistance: number = 80,
    autoRefresh: boolean = false,
    refreshInterval: number = 10000
): UseProximityValidationReturn => {
    
    const [state, setState] = useState<ProximityState>({
        userLocation: null,
        isInRange: false,
        distance: null,
        isLoading: false,
        error: null
    });

    /**
     * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
     * @param lat1 - Latitud del primer punto
     * @param lon1 - Longitud del primer punto  
     * @param lat2 - Latitud del segundo punto
     * @param lon2 - Longitud del segundo punto
     * @returns Distancia en metros
     */
    const calculateDistance = useCallback((
        lat1: number, 
        lon1: number, 
        lat2: number, 
        lon2: number
    ): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en metros
    }, []);

    /**
     * Obtiene la ubicación actual del usuario y calcula la proximidad
     */
    const checkProximity = useCallback(async (): Promise<void> => {
        if (!targetLocation) {
            setState(prev => ({
                ...prev,
                error: 'Ubicación objetivo no disponible',
                isLoading: false
            }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            
            console.log('📍 Verificando proximidad...');
            console.log('🎯 Objetivo:', targetLocation);

            // Verificar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permisos de ubicación denegados');
            }

            // Obtener ubicación actual con alta precisión
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                //timeout: 15000,
                //maximumAge: 5000, // Cache de 5 segundos
            });

            const userCoords: Coordinates = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            console.log('📱 Usuario:', userCoords);

            // Calcular distancia
            const distance = calculateDistance(
                userCoords.latitude, 
                userCoords.longitude,
                targetLocation.latitude, 
                targetLocation.longitude
            );

            const isInRange = distance <= minDistance;

            console.log(`📏 Distancia: ${Math.round(distance)}m (mín: ${minDistance}m)`);
            console.log(`✅ En rango: ${isInRange}`);

            setState({
                userLocation: userCoords,
                isInRange,
                distance: Math.round(distance),
                isLoading: false,
                error: null
            });

        } catch (error) {
            console.error('❌ Error en proximidad:', error);
            
            let errorMessage = 'Error obteniendo ubicación';
            if (error instanceof Error) {
                if (error.message.includes('denegados')) {
                    errorMessage = 'Permisos de ubicación denegados';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Timeout GPS - Verifica tu conexión';
                } else {
                    errorMessage = error.message;
                }
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
        }
    }, [targetLocation, minDistance, calculateDistance]);

    /**
     * Alias para checkProximity (más semánticamente claro)
     */
    const refreshLocation = useCallback(async (): Promise<void> => {
        await checkProximity();
    }, [checkProximity]);

    // Auto-refresh si está habilitado
    useEffect(() => {
        if (autoRefresh && targetLocation) {
            const interval = setInterval(() => {
                checkProximity();
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, checkProximity, targetLocation]);

    // Verificar proximidad inicial
    useEffect(() => {
        if (targetLocation) {
            checkProximity();
        }
    }, [targetLocation, checkProximity]);

    return {
        ...state,
        checkProximity,
        refreshLocation,
        minDistance
    };
};