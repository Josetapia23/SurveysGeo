// src/components/ProximityStatus.tsx
import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle
} from 'react-native';
import { useProximityValidation, Coordinates } from '../hooks/useProximityValidation';

interface ProximityStatusProps {
    targetLocation: Coordinates;
    minDistance?: number;
    onProximityChange?: (isInRange: boolean, distance: number | null) => void;
    style?: ViewStyle;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const ProximityStatus: React.FC<ProximityStatusProps> = ({
    targetLocation,
    minDistance = 80,
    onProximityChange,
    style,
    autoRefresh = false,
    refreshInterval = 10000
}) => {
    const {
        isInRange,
        distance,
        isLoading,
        error,
        checkProximity,
        userLocation
    } = useProximityValidation(targetLocation, minDistance, autoRefresh, refreshInterval);

    // Notificar cambios de proximidad al componente padre
    useEffect(() => {
        if (onProximityChange) {
            onProximityChange(isInRange, distance);
        }
    }, [isInRange, distance, onProximityChange]);

    /**
     * Determina el color del estado según la proximidad
     */
    const getStatusColor = (): string => {
        if (isLoading) return '#95a5a6'; // Gris
        if (error) return '#e74c3c'; // Rojo
        if (!distance) return '#95a5a6'; // Gris

        if (isInRange) return '#27ae60'; // Verde

        // Gradiente de colores según proximidad
        const distanceFromTarget = distance - minDistance;
        if (distanceFromTarget <= 20) return '#f39c12'; // Amarillo (muy cerca)
        return '#e74c3c'; // Rojo (lejos)
    };

    /**
     * Obtiene el texto del estado actual
     */
    const getStatusText = (): string => {
        if (isLoading) return 'Verificando ubicación...';
        if (error) return 'Error GPS';
        if (!distance) return 'Ubicación no disponible';

        if (isInRange) {
            return `✅ En rango (${distance}m)`;
        } else {
            const distanceNeeded = distance - minDistance;
            return `❌ Muy lejos (${distance}m) - Acércate ${distanceNeeded}m`;
        }
    };

    /**
     * Obtiene el texto de ayuda adicional
     */
    const getHelpText = (): string => {
        if (isLoading || error || !distance) return `Distancia mínima requerida: ${minDistance}m`;

        if (isInRange) {
            return '¡Perfecto! Puedes realizar la encuesta';
        } else {
            const distanceFromTarget = distance - minDistance;
            if (distanceFromTarget <= 20) {
                return '¡Casi! Te falta muy poco';
            } else if (distanceFromTarget <= 50) {
                return 'Camina un poco más hacia el líder';
            } else {
                return 'Necesitas acercarte más al líder';
            }
        }
    };

    /**
     * Obtiene el ícono según el estado
     */
    const getStatusIcon = (): string => {
        if (isLoading) return '⏳';
        if (error) return '❌';
        if (!distance) return '📍';

        if (isInRange) return '✅';

        const distanceFromTarget = distance - minDistance;
        if (distanceFromTarget <= 20) return '⚠️';
        return '❌';
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header con estado principal */}
            <View style={[styles.statusHeader, { borderLeftColor: getStatusColor() }]}>
                <View style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                {getStatusText()}
                            </Text>
                            <Text style={styles.helpText}>
                                {getHelpText()}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.refreshButton, { backgroundColor: getStatusColor() }]}
                        onPress={checkProximity}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.refreshIcon}>🔄</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Detalles adicionales */}
            {(distance || userLocation) && (
                <View style={styles.detailsContainer}>
                    {distance && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Distancia actual:</Text>
                            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
                                {distance}m
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Mínimo requerido:</Text>
                        <Text style={styles.detailValue}>{minDistance}m</Text>
                    </View>

                    {userLocation && (
                        <View style={styles.coordsContainer}>
                            <Text style={styles.coordsLabel}>Tu ubicación:</Text>
                            <Text style={styles.coordsText}>
                                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Mensaje de error específico */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {error.includes('Permisos') && (
                        <Text style={styles.errorHelp}>
                            Ve a Configuración → Aplicaciones → SurveysGeo → Permisos → Ubicación
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusHeader: {
        borderLeftWidth: 4,
        paddingLeft: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    helpText: {
        fontSize: 12,
        color: '#7f8c8d',
        lineHeight: 16,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    refreshIcon: {
        fontSize: 16,
        color: '#fff',
    },
    detailsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    coordsContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
    },
    coordsLabel: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 2,
    },
    coordsText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#7f8c8d',
    },
    errorContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fee',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c',
    },
    errorText: {
        fontSize: 14,
        color: '#e74c3c',
        fontWeight: '600',
        marginBottom: 4,
    },
    errorHelp: {
        fontSize: 12,
        color: '#c0392b',
        lineHeight: 16,
    },
});

export default ProximityStatus;