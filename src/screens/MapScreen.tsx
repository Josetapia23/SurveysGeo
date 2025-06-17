import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    FlatList,
    Dimensions,
    ActivityIndicator,
    Linking
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';   
import { useUser } from '../context/UserContext';
import { ApiService, API_CONFIG, LiderResponse } from '../services/api';

// Tipos para navegación
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

interface MapScreenProps {
    navigation: MapScreenNavigationProp;
}

interface UserLocation {
    latitude: number;
    longitude: number;
}

interface LiderWithDistance extends LiderResponse {
    distance: number; // en metros
}

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
    const { user } = useUser();
    const mapRef = useRef<MapView>(null);

    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
    const [isLoadingLideres, setIsLoadingLideres] = useState<boolean>(true);
    const [selectedLider, setSelectedLider] = useState<LiderResponse | null>(null);
    
    // 🔥 DATOS REALES DE LA API
    const [allLideres, setAllLideres] = useState<LiderResponse[]>([]);
    const [lideresPendientes, setLideresPendientes] = useState<LiderResponse[]>([]);

    // Función helper para limpiar datos de líderes
    const cleanLiderData = (lider: any): LiderResponse => {
        return {
            id: Number(lider.id || lider.idlider || 0),
            cedula: String(lider.cedula || '').trim(),
            nombres: String(lider.nombres || '').trim(),
            apellidos: String(lider.apellidos || '').trim(),
            celular: String(lider.celular || '').trim(),
            direccion: String(lider.direccion || '').trim(),
            barrio: String(lider.barrio || '').trim(),
            municipio_residencia: String(lider.municipio_residencia || '').trim(),
            municipio_operacion: String(lider.municipio_operacion || '').trim(),
            status: lider.status === 'visitado' ? 'visitado' : 'pendiente',
            fecha_encuesta: lider.fecha_encuesta || null,
            grupo: String(lider.grupo || '').trim(),
            meta: Number(lider.meta || 0),
            coordinates: {
                latitude: Number(lider.coordinates?.latitude || 10.96),
                longitude: Number(lider.coordinates?.longitude || -74.80)
            }
        };
    };

    // 🔥 CARGAR LÍDERES DESDE LA API
    const cargarLideres = async (): Promise<void> => {
        try {
            setIsLoadingLideres(true);
            console.log('🗺️ Cargando líderes para el mapa...');

            const response = await ApiService.get<{
                lideres: any[];
                statistics: any;
            }>(API_CONFIG.ENDPOINTS.LIDERES);

            if (response.success && response.data) {
                const lideresLimpios = response.data.lideres.map(cleanLiderData);
                setAllLideres(lideresLimpios);
                
                // Filtrar solo los pendientes para el mapa
                const pendientes = lideresLimpios.filter(lider => lider.status === 'pendiente');
                setLideresPendientes(pendientes);
                
                console.log(`✅ Cargados ${lideresLimpios.length} líderes (${pendientes.length} pendientes)`);
            } else {
                throw new Error(response.message || 'Error obteniendo líderes');
            }
        } catch (error) {
            console.error('❌ Error cargando líderes:', error);
            Alert.alert(
                'Error',
                'No se pudieron cargar los líderes. Verifica tu conexión.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoadingLideres(false);
        }
    };

    // Cargar líderes al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            cargarLideres();
        }, [])
    );

    // Calcular distancia entre dos puntos (fórmula de Haversine)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Obtener líderes con distancias ordenados por cercanía
    const getLideresWithDistance = (): LiderWithDistance[] => {
        if (!userLocation) return [];

        return lideresPendientes
            .map(lider => ({
                ...lider,
                distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    lider.coordinates.latitude,
                    lider.coordinates.longitude
                )
            }))
            .sort((a, b) => a.distance - b.distance);
    };

    const lideresWithDistance = getLideresWithDistance();

    // Obtener ubicación del usuario
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async (): Promise<void> => {
        try {
            setIsLoadingLocation(true);
            console.log('📍 Obteniendo ubicación del usuario...');

            // Solicitar permisos
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permisos Requeridos',
                    'Necesitamos acceso a tu ubicación para mostrar el mapa correctamente.',
                    [{ text: 'OK' }]
                );
                setIsLoadingLocation(false);
                return;
            }

            // Obtener ubicación actual
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const userLoc: UserLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(userLoc);
            console.log('✅ Ubicación obtenida:', userLoc);

            // Centrar el mapa en la ubicación del usuario
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...userLoc,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 1000);
            }

        } catch (error) {
            console.error('❌ Error obteniendo ubicación:', error);
            Alert.alert(
                'Error GPS',
                'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.',
                [
                    { text: 'Reintentar', onPress: getCurrentLocation },
                    { text: 'Continuar' }
                ]
            );
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleMarkerPress = (lider: LiderResponse): void => {
        setSelectedLider(lider);
        console.log('📍 Marcador seleccionado:', lider.nombres);

        // Centrar mapa en el líder seleccionado
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: lider.coordinates.latitude,
                longitude: lider.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const handleLiderSelect = (lider: LiderWithDistance): void => {
        setSelectedLider(lider);

        // Centrar mapa en el líder
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: lider.coordinates.latitude,
                longitude: lider.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const handleNavigateToLider = (lider: LiderResponse): void => {
        const { latitude, longitude } = lider.coordinates;
        
        Alert.alert(
            'Navegar al Líder',
            `¿Deseas abrir la navegación hacia ${lider.nombres}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Google Maps',
                    onPress: () => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                        Linking.openURL(url).catch(() => {
                            Alert.alert('Error', 'No se pudo abrir Google Maps');
                        });
                    }
                },
                {
                    text: 'Waze',
                    onPress: () => {
                        const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
                        Linking.openURL(url).catch(() => {
                            Alert.alert('Error', 'No se pudo abrir Waze');
                        });
                    }
                }
            ]
        );
    };

    const formatDistance = (distance: number): string => {
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    };

    const toggleMapSize = (): void => {
        setIsMapExpanded(!isMapExpanded);
    };

    const renderLiderItem = ({ item }: { item: LiderWithDistance }) => (
        <TouchableOpacity
            style={[
                styles.clientItem,
                selectedLider?.id === item.id && styles.clientItemSelected
            ]}
            onPress={() => handleLiderSelect(item)}
        >
            <View style={styles.clientItemContent}>
                <View style={styles.clientItemInfo}>
                    <Text style={styles.clientName}>
                        {item.nombres} {item.apellidos}
                    </Text>
                    <Text style={styles.clientAddress}>{item.direccion}</Text>
                    <Text style={styles.clientBarrio}>{item.barrio}</Text>
                    <Text style={styles.clientCedula}>CC: {item.cedula}</Text>
                </View>
                <View style={styles.clientItemActions}>
                    <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
                    <TouchableOpacity
                        style={styles.surveyButton}
                        onPress={() => navigation.navigate('Survey', {
                            clientId: item.id.toString(),
                            client: {
                                id: item.id.toString(),
                                cedula: item.cedula,
                                nombre: item.nombres,
                                apellido: item.apellidos,
                                direccion: item.direccion,
                                celular: item.celular,
                                barrio: item.barrio,
                                ciudad: 'Barranquilla',
                                coordinates: item.coordinates,
                                assignedTo: user?.id || '',
                                status: item.status
                            }
                        })}
                    >
                        <Text style={styles.surveyButtonText}>Encuestar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Mapa */}
            <View style={[
                styles.mapContainer,
                isMapExpanded ? styles.mapContainerExpanded : styles.mapContainerNormal
            ]}>
                {(isLoadingLocation || isLoadingLideres) && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3498db" />
                        <Text style={styles.loadingText}>
                            {isLoadingLocation ? 'Obteniendo ubicación...' : 'Cargando líderes...'}
                        </Text>
                    </View>
                )}

                <MapView
                    ref={mapRef}
                    style={styles.map}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    initialRegion={{
                        latitude: 10.9639, // Barranquilla centro
                        longitude: -74.7964,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {/* 🔥 MARCADORES DE LÍDERES REALES */}
                    {lideresPendientes.map((lider) => (
                        <Marker
                            key={lider.id}
                            coordinate={lider.coordinates}
                            onPress={() => handleMarkerPress(lider)}
                            title={lider.nombres}
                            description={`${lider.direccion} - ${lider.barrio}`}
                        >
                            <View style={[
                                styles.customMarker,
                                selectedLider?.id === lider.id && styles.customMarkerSelected
                            ]}>
                                <Text style={styles.markerText}>📍</Text>
                            </View>
                        </Marker>
                    ))}
                </MapView>

                {/* Botón para expandir/contraer mapa */}
                <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleMapSize}
                >
                    <Text style={styles.expandButtonText}>
                        {isMapExpanded ? '⬇️' : '⬆️'}
                    </Text>
                </TouchableOpacity>

                {/* Botón de mi ubicación */}
                <TouchableOpacity
                    style={styles.locationButton}
                    onPress={getCurrentLocation}
                >
                    <Text style={styles.locationButtonText}>📍</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de líderes por cercanía */}
            {!isMapExpanded && (
                <View style={styles.clientsContainer}>
                    <Text style={styles.clientsTitle}>
                        Líderes Pendientes ({lideresPendientes.length})
                    </Text>
                    <Text style={styles.clientsSubtitle}>Ordenados por distancia</Text>

                    {lideresWithDistance.length > 0 ? (
                        <FlatList
                            data={lideresWithDistance}
                            renderItem={renderLiderItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.clientsList}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                                {isLoadingLideres 
                                    ? 'Cargando líderes...' 
                                    : userLocation 
                                        ? 'No hay líderes pendientes'
                                        : 'Obteniendo ubicación para calcular distancias...'
                                }
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Información del líder seleccionado */}
            {selectedLider && (
                <View style={styles.selectedClientInfo}>
                    <Text style={styles.selectedClientName}>
                        {selectedLider.nombres} {selectedLider.apellidos}
                    </Text>
                    <Text style={styles.selectedClientAddress}>
                        📍 {selectedLider.direccion}
                    </Text>
                    <Text style={styles.selectedClientBarrio}>
                        {selectedLider.barrio}, Barranquilla
                    </Text>
                    <View style={styles.selectedClientActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleNavigateToLider(selectedLider)}
                        >
                            <Text style={styles.actionButtonText}>Navegar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonPrimary]}
                            onPress={() => navigation.navigate('Survey', {
                                clientId: selectedLider.id.toString(),
                                client: {
                                    id: selectedLider.id.toString(),
                                    cedula: selectedLider.cedula,
                                    nombre: selectedLider.nombres,
                                    apellido: selectedLider.apellidos,
                                    direccion: selectedLider.direccion,
                                    celular: selectedLider.celular,
                                    barrio: selectedLider.barrio,
                                    ciudad: 'Barranquilla',
                                    coordinates: selectedLider.coordinates,
                                    assignedTo: user?.id || '',
                                    status: selectedLider.status
                                }
                            })}
                        >
                            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                                Encuestar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mapContainer: {
        position: 'relative',
    },
    mapContainerNormal: {
        height: height * 0.4, // 40% de la pantalla
    },
    mapContainerExpanded: {
        height: height * 0.8, // 80% de la pantalla
    },
    map: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#3498db',
    },
    customMarker: {
        width: 35,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 17.5,
        borderWidth: 3,
        borderColor: '#e74c3c',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    customMarkerSelected: {
        borderColor: '#27ae60',
        backgroundColor: '#e8f5e8',
        transform: [{ scale: 1.1 }],
    },
    markerText: {
        fontSize: 14,
    },
    expandButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    expandButtonText: {
        fontSize: 16,
    },
    locationButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#3498db',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    locationButtonText: {
        fontSize: 20,
        color: '#fff',
    },
    clientsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    clientsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    clientsSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 16,
    },
    clientsList: {
        paddingBottom: 20,
    },
    clientItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    clientItemSelected: {
        borderWidth: 2,
        borderColor: '#27ae60',
    },
    clientItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clientItemInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    clientAddress: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    clientBarrio: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 2,
    },
    clientCedula: {
        fontSize: 11,
        color: '#bdc3c7',
    },
    clientItemActions: {
        alignItems: 'flex-end',
    },
    distanceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#27ae60',
        marginBottom: 6,
    },
    surveyButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    surveyButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    selectedClientInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    selectedClientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    selectedClientAddress: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    selectedClientBarrio: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 12,
    },
    selectedClientActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#3498db',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    actionButtonPrimary: {
        backgroundColor: '#3498db',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3498db',
    },
    actionButtonTextPrimary: {
        color: '#fff',
    },
});

export default MapScreen;