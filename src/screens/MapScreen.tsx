import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    FlatList,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';   
import { useUser } from '../context/UserContext';
import { Client } from '../../App';

// Tipos para navegación
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

interface MapScreenProps {
    navigation: MapScreenNavigationProp;
}

interface UserLocation {
    latitude: number;
    longitude: number;
}

interface ClientWithDistance extends Client {
    distance: number; // en metros
}

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
    const { user } = useUser();
    const mapRef = useRef<MapView>(null);

    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Datos mock de clientes (después vendrán de Firebase)
    const mockClients: Client[] = [
        {
            id: 'client1',
            cedula: '12345678',
            nombre: 'Ana María',
            apellido: 'Rodríguez',
            direccion: 'Calle 45 #23-67',
            celular: '3001234567',
            barrio: 'El Prado',
            ciudad: 'Barranquilla',
            coordinates: { latitude: 10.9639, longitude: -74.7964 },
            assignedTo: user?.id || 'gestor1',
            status: 'pendiente'
        },
        {
            id: 'client2',
            cedula: '87654321',
            nombre: 'Carlos',
            apellido: 'Mendoza',
            direccion: 'Carrera 58 #76-45',
            celular: '3109876543',
            barrio: 'Recreo',
            ciudad: 'Barranquilla',
            coordinates: { latitude: 10.9878, longitude: -74.7889 },
            assignedTo: user?.id || 'gestor1',
            status: 'visitado'
        },
        {
            id: 'client3',
            cedula: '11223344',
            nombre: 'Lucía',
            apellido: 'González',
            direccion: 'Calle 72 #41-23',
            celular: '3201122334',
            barrio: 'Riomar',
            ciudad: 'Barranquilla',
            coordinates: { latitude: 10.9456, longitude: -74.8123 },
            assignedTo: user?.id || 'gestor1',
            status: 'pendiente'
        },
        {
            id: 'client4',
            cedula: '99887766',
            nombre: 'Roberto',
            apellido: 'Silva',
            direccion: 'Carrera 46 #68-12',
            celular: '3159988776',
            barrio: 'Boston',
            ciudad: 'Barranquilla',
            coordinates: { latitude: 10.9712, longitude: -74.7845 },
            assignedTo: user?.id || 'gestor1',
            status: 'visitado'
        },
        {
            id: 'client5',
            cedula: '55443322',
            nombre: 'Patricia',
            apellido: 'Herrera',
            direccion: 'Calle 84 #52-18',
            celular: '3125544332',
            barrio: 'Alto Prado',
            ciudad: 'Barranquilla',
            coordinates: { latitude: 10.9334, longitude: -74.8067 },
            assignedTo: user?.id || 'gestor1',
            status: 'pendiente'
        }
    ];

    // Filtrar solo clientes pendientes
    const pendingClients = mockClients.filter(client => client.status === 'pendiente');

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

    // Obtener clientes con distancias ordenados por cercanía
    const getClientsWithDistance = (): ClientWithDistance[] => {
        if (!userLocation) return [];

        return pendingClients
            .map(client => ({
                ...client,
                distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    client.coordinates.latitude,
                    client.coordinates.longitude
                )
            }))
            .sort((a, b) => a.distance - b.distance);
    };

    const clientsWithDistance = getClientsWithDistance();

    // Obtener ubicación del usuario
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async (): Promise<void> => {
        try {
            setIsLoadingLocation(true);

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

            // Centrar el mapa en la ubicación del usuario
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...userLoc,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 1000);
            }

        } catch (error) {
            console.error('Error obteniendo ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleMarkerPress = (client: Client): void => {
        setSelectedClient(client);

        // Centrar mapa en el cliente seleccionado
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: client.coordinates.latitude,
                longitude: client.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const handleClientSelect = (client: ClientWithDistance): void => {
        setSelectedClient(client);

        // Centrar mapa en el cliente
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: client.coordinates.latitude,
                longitude: client.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }
    };

    const handleNavigateToClient = (client: Client): void => {
        Alert.alert(
            'Navegar al Cliente',
            `¿Deseas abrir la navegación hacia ${client.nombre} ${client.apellido}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Navegar',
                    onPress: () => {
                        // TODO: Abrir Google Maps con navegación
                        Alert.alert('Navegación', 'Próximamente se abrirá Google Maps');
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

    const renderClientItem = ({ item }: { item: ClientWithDistance }) => (
        <TouchableOpacity
            style={[
                styles.clientItem,
                selectedClient?.id === item.id && styles.clientItemSelected
            ]}
            onPress={() => handleClientSelect(item)}
        >
            <View style={styles.clientItemContent}>
                <View style={styles.clientItemInfo}>
                    <Text style={styles.clientName}>{item.nombre} {item.apellido}</Text>
                    <Text style={styles.clientAddress}>{item.direccion}</Text>
                    <Text style={styles.clientBarrio}>{item.barrio}</Text>
                </View>
                <View style={styles.clientItemActions}>
                    <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
                    <TouchableOpacity
                        style={styles.surveyButton}
                        onPress={() => navigation.navigate('Survey', {
                            clientId: item.id,
                            client: item
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
                {isLoadingLocation && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3498db" />
                        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
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
                    {/* Marcadores de clientes pendientes */}
                    {pendingClients.map((client) => (
                        <Marker
                            key={client.id}
                            coordinate={client.coordinates}
                            onPress={() => handleMarkerPress(client)}
                            pinColor={selectedClient?.id === client.id ? '#27ae60' : '#e74c3c'}
                        >
                            <View style={[
                                styles.customMarker,
                                selectedClient?.id === client.id && styles.customMarkerSelected
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

            {/* Lista de clientes por cercanía */}
            {!isMapExpanded && (
                <View style={styles.clientsContainer}>
                    <Text style={styles.clientsTitle}>
                        Clientes Pendientes ({pendingClients.length})
                    </Text>
                    <Text style={styles.clientsSubtitle}>Ordenados por distancia</Text>

                    <FlatList
                        data={clientsWithDistance}
                        renderItem={renderClientItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.clientsList}
                    />
                </View>
            )}

            {/* Información del cliente seleccionado */}
            {selectedClient && (
                <View style={styles.selectedClientInfo}>
                    <Text style={styles.selectedClientName}>
                        {selectedClient.nombre} {selectedClient.apellido}
                    </Text>
                    <Text style={styles.selectedClientAddress}>
                        📍 {selectedClient.direccion}
                    </Text>
                    <View style={styles.selectedClientActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleNavigateToClient(selectedClient)}
                        >
                            <Text style={styles.actionButtonText}>Navegar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonPrimary]}
                            onPress={() => navigation.navigate('Survey', {
                                clientId: selectedClient.id,
                                client: selectedClient
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
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#e74c3c',
    },
    customMarkerSelected: {
        borderColor: '#27ae60',
        backgroundColor: '#e8f5e8',
    },
    markerText: {
        fontSize: 12,
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
        borderRadius: 8,
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