import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Client } from '../../App';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

// Tipos para navegación
type ClientListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientList'>;

interface ClientListScreenProps {
    navigation: ClientListScreenNavigationProp;
}

type FilterType = 'todos' | 'pendientes' | 'visitados';

const ClientListScreen: React.FC<ClientListScreenProps> = ({ navigation }) => {
    const { user } = useUser();
    const [searchText, setSearchText] = useState<string>('');
    const [filter, setFilter] = useState<FilterType>('todos');

    // Datos mock - después vendrán de Firebase
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

    // Filtrar clientes
    const filteredClients = useMemo(() => {
        let clients = mockClients;

        // Filtrar por status
        if (filter === 'pendientes') {
            clients = clients.filter(client => client.status === 'pendiente');
        } else if (filter === 'visitados') {
            clients = clients.filter(client => client.status === 'visitado');
        }

        // Filtrar por búsqueda
        if (searchText.trim()) {
            const search = searchText.toLowerCase().trim();
            clients = clients.filter(client =>
                client.nombre.toLowerCase().includes(search) ||
                client.apellido.toLowerCase().includes(search) ||
                client.cedula.includes(search) ||
                client.barrio.toLowerCase().includes(search) ||
                client.direccion.toLowerCase().includes(search)
            );
        }

        return clients;
    }, [mockClients, filter, searchText]);

    // Estadísticas
    const stats = useMemo(() => {
        const total = mockClients.length;
        const pendientes = mockClients.filter(c => c.status === 'pendiente').length;
        const visitados = mockClients.filter(c => c.status === 'visitado').length;

        return { total, pendientes, visitados };
    }, [mockClients]);

    const handleClientPress = (client: Client): void => {
        Alert.alert(
            'Opciones para Cliente',
            `${client.nombre} ${client.apellido}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ver en Mapa',
                    onPress: () => {
                        // TODO: Navegar al mapa con este cliente seleccionado
                        navigation.navigate('Map');
                    }
                },
                {
                    text: client.status === 'pendiente' ? 'Realizar Encuesta' : 'Ver Encuesta',
                    onPress: () => {
                        navigation.navigate('Survey', {
                            clientId: client.id,
                            client: client
                        });
                    }
                }
            ]
        );
    };

    const handleCallClient = (client: Client): void => {
        Alert.alert(
            'Llamar Cliente',
            `¿Deseas llamar a ${client.nombre} ${client.apellido}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Llamar',
                    onPress: () => {
                        // TODO: Integrar con sistema de llamadas
                        Alert.alert('Función de llamadas', 'Próximamente...');
                    }
                }
            ]
        );
    };

    const renderClientItem = ({ item }: { item: Client }) => (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => handleClientPress(item)}
        >
            <View style={styles.clientHeader}>
                <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                        {item.nombre} {item.apellido}
                    </Text>
                    <Text style={styles.clientId}>CC: {item.cedula}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    item.status === 'visitado' ? styles.statusVisitado : styles.statusPendiente
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'visitado' ? styles.statusTextVisitado : styles.statusTextPendiente
                    ]}>
                        {item.status === 'visitado' ? 'Visitado' : 'Pendiente'}
                    </Text>
                </View>
            </View>

            <View style={styles.clientDetails}>
                <Text style={styles.clientAddress}>📍 {item.direccion}</Text>
                <Text style={styles.clientBarrio}>{item.barrio}, {item.ciudad}</Text>
                <Text style={styles.clientPhone}>📞 {item.celular}</Text>
            </View>

            <View style={styles.clientActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCallClient(item)}
                >
                    <Text style={styles.actionButtonText}>Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => navigation.navigate('Survey', {
                        clientId: item.id,
                        client: item
                    })}
                >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                        {item.status === 'pendiente' ? 'Encuestar' : 'Ver Encuesta'}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
                {searchText.trim()
                    ? 'No se encontraron clientes con ese criterio'
                    : filter === 'pendientes'
                        ? 'No hay clientes pendientes'
                        : 'No hay clientes visitados'
                }
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Estadísticas */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, styles.pendingNumber]}>{stats.pendientes}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, styles.completedNumber]}>{stats.visitados}</Text>
                    <Text style={styles.statLabel}>Visitados</Text>
                </View>
            </View>

            {/* Búsqueda */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, cédula, barrio..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* Filtros */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'todos' && styles.filterButtonActive]}
                    onPress={() => setFilter('todos')}
                >
                    <Text style={[styles.filterText, filter === 'todos' && styles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pendientes' && styles.filterButtonActive]}
                    onPress={() => setFilter('pendientes')}
                >
                    <Text style={[styles.filterText, filter === 'pendientes' && styles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'visitados' && styles.filterButtonActive]}
                    onPress={() => setFilter('visitados')}
                >
                    <Text style={[styles.filterText, filter === 'visitados' && styles.filterTextActive]}>
                        Visitados
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista de clientes */}
            <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3498db',
        marginBottom: 4,
    },
    pendingNumber: {
        color: '#f39c12',
    },
    completedNumber: {
        color: '#27ae60',
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#3498db',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7f8c8d',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 16,
    },
    clientCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    clientId: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPendiente: {
        backgroundColor: '#fff3cd',
    },
    statusVisitado: {
        backgroundColor: '#d1edff',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextPendiente: {
        color: '#856404',
    },
    statusTextVisitado: {
        color: '#0c5460',
    },
    clientDetails: {
        marginBottom: 16,
    },
    clientAddress: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 4,
    },
    clientBarrio: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    clientPhone: {
        fontSize: 14,
        color: '#2c3e50',
    },
    clientActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3498db',
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
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
});

export default ClientListScreen;