import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Linking
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { ApiService, API_CONFIG, LiderResponse } from '../services/api';

// Tipos para navegación
type ClientListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientList'>;

interface ClientListScreenProps {
    navigation: ClientListScreenNavigationProp;
}

type FilterType = 'todos' | 'pendientes' | 'visitados';

interface EstadisticasLideres {
    total: number;
    pendientes: number;
    visitados: number;
    porcentaje_completado: number;
}

// Función helper para limpiar y validar datos de líderes
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

const ClientListScreen: React.FC<ClientListScreenProps> = ({ navigation }) => {
    const { user } = useUser();
    const [allLideres, setAllLideres] = useState<LiderResponse[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [filter, setFilter] = useState<FilterType>('todos');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // ⚡ CARGAR TODOS LOS LÍDERES UNA SOLA VEZ
    const cargarTodosLosLideres = async (mostrarRefresh = false): Promise<void> => {
        try {
            if (mostrarRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            console.log('👥 Cargando TODOS los líderes del gestor...');

            const response = await ApiService.get<{
                lideres: any[];
                statistics: EstadisticasLideres;
            }>(API_CONFIG.ENDPOINTS.LIDERES);

            if (response.success && response.data) {
                const lideresLimpios = response.data.lideres.map(cleanLiderData);
                setAllLideres(lideresLimpios);
                console.log(`✅ Cargados ${lideresLimpios.length} líderes (todos)`);
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
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Cargar datos solo al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            cargarTodosLosLideres();
        }, [])
    );

    // Función para refrescar
    const onRefresh = useCallback(() => {
        cargarTodosLosLideres(true);
    }, []);

    // ⚡ FILTROS LOCALES
    const filteredByStatus = useMemo(() => {
        switch (filter) {
            case 'pendientes':
                return allLideres.filter(lider => lider.status === 'pendiente');
            case 'visitados':
                return allLideres.filter(lider => lider.status === 'visitado');
            default:
                return allLideres;
        }
    }, [allLideres, filter]);

    // ⚡ BÚSQUEDA LOCAL
    const filteredLideres = useMemo(() => {
        if (!searchText.trim()) {
            return filteredByStatus;
        }

        const search = searchText.toLowerCase().trim();
        return filteredByStatus.filter(lider => {
            const containsSearch = (field: string | null | undefined): boolean => {
                if (!field) return false;
                return String(field).toLowerCase().includes(search);
            };

            return (
                containsSearch(lider.nombres) ||
                containsSearch(lider.apellidos) ||
                containsSearch(lider.cedula) ||
                containsSearch(lider.barrio) ||
                containsSearch(lider.direccion) ||
                containsSearch(lider.celular)
            );
        });
    }, [filteredByStatus, searchText]);

    // ⚡ ESTADÍSTICAS CALCULADAS LOCALMENTE
    const estadisticas = useMemo((): EstadisticasLideres => {
        const total = allLideres.length;
        const pendientes = allLideres.filter(l => l.status === 'pendiente').length;
        const visitados = allLideres.filter(l => l.status === 'visitado').length;
        const porcentaje_completado = total > 0 ? Math.round((visitados / total) * 100 * 10) / 10 : 0;

        return {
            total,
            pendientes,
            visitados,
            porcentaje_completado
        };
    }, [allLideres]);

    // 🎯 FUNCIÓN PARA CAMBIAR FILTRO AL HACER CLICK EN ESTADÍSTICAS
    const handleStatClick = (newFilter: FilterType): void => {
        console.log(`📊 Click en estadística: ${newFilter}`);
        setFilter(newFilter);

        // Limpiar búsqueda al cambiar filtro para mejor UX
        if (searchText.trim()) {
            setSearchText('');
        }
    };

    const handleClientPress = (lider: LiderResponse): void => {
        Alert.alert(
            'Opciones para Líder',
            `${lider.nombres || 'Sin nombre'} ${lider.apellidos || ''}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ver en Mapa',
                    onPress: () => {
                        navigation.navigate('Map');
                    }
                },
                {
                    text: lider.status === 'pendiente' ? 'Realizar Encuesta' : 'Ver Encuesta',
                    onPress: () => {
                        navigation.navigate('Survey', {
                            clientId: lider.id.toString(),
                            client: {
                                id: lider.id.toString(),
                                cedula: lider.cedula || '',
                                nombre: lider.nombres || 'Sin nombre',
                                apellido: lider.apellidos || '',
                                direccion: lider.direccion || '',
                                celular: lider.celular || '',
                                barrio: lider.barrio || '',
                                ciudad: 'Barranquilla',
                                coordinates: lider.coordinates,
                                assignedTo: user?.id || '',
                                status: lider.status
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleCallClient = (lider: LiderResponse): void => {
        if (!lider.celular || lider.celular.trim() === '') {
            Alert.alert(
                'Sin Teléfono',
                'Este líder no tiene número de teléfono registrado',
                [{ text: 'OK' }]
            );
            return;
        }

        const cleanPhone = lider.celular.replace(/[^0-9+]/g, '');

        Alert.alert(
            'Llamar Líder',
            `¿Deseas llamar a ${lider.nombres || 'Líder'} ${lider.apellidos || ''}?\n\n📞 ${lider.celular}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Llamar',
                    onPress: () => {
                        const phoneUrl = `tel:${cleanPhone}`;

                        Linking.canOpenURL(phoneUrl)
                            .then((canOpen) => {
                                if (canOpen) {
                                    Linking.openURL(phoneUrl);
                                } else {
                                    Alert.alert(
                                        'Error',
                                        'No se puede realizar la llamada desde este dispositivo'
                                    );
                                }
                            })
                            .catch((error) => {
                                console.error('Error al intentar llamar:', error);
                                Alert.alert(
                                    'Error',
                                    'Ocurrió un error al intentar realizar la llamada'
                                );
                            });
                    }
                }
            ]
        );
    };

    const renderClientItem = ({ item }: { item: LiderResponse }) => (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => handleClientPress(item)}
        >
            <View style={styles.clientHeader}>
                <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                        {item.nombres || 'Sin nombre'} {item.apellidos || ''}
                    </Text>
                    <Text style={styles.clientId}>
                        CC: {item.cedula || 'Sin cédula'}
                    </Text>
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
                <Text style={styles.clientAddress}>
                    📍 {item.direccion || 'Sin dirección'}
                </Text>
                <Text style={styles.clientBarrio}>
                    {item.barrio || 'Sin barrio'}, Barranquilla
                </Text>
                {item.celular && (
                    <Text style={styles.clientPhone}>📞 {item.celular}</Text>
                )}
                {item.fecha_encuesta && (
                    <Text style={styles.clientDate}>
                        📅 Encuestado: {new Date(item.fecha_encuesta).toLocaleDateString()}
                    </Text>
                )}
            </View>

            <View style={styles.clientActions}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        (!item.celular || item.celular.trim() === '') && styles.actionButtonDisabled
                    ]}
                    onPress={() => handleCallClient(item)}
                    disabled={!item.celular || item.celular.trim() === ''}
                >
                    <Text style={[
                        styles.actionButtonText,
                        (!item.celular || item.celular.trim() === '') && styles.actionButtonTextDisabled
                    ]}>
                        Llamar
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => navigation.navigate('Survey', {
                        clientId: item.id.toString(),
                        client: {
                            id: item.id.toString(),
                            cedula: item.cedula || '',
                            nombre: item.nombres || 'Sin nombre',
                            apellido: item.apellidos || '',
                            direccion: item.direccion || '',
                            celular: item.celular || '',
                            barrio: item.barrio || '',
                            ciudad: 'Barranquilla',
                            coordinates: item.coordinates,
                            assignedTo: user?.id || '',
                            status: item.status
                        }
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
                    ? 'No se encontraron líderes con ese criterio'
                    : isLoading
                        ? 'Cargando líderes...'
                        : filter === 'pendientes'
                            ? 'No hay líderes pendientes'
                            : filter === 'visitados'
                                ? 'No hay líderes visitados'
                                : 'No hay líderes asignados'
                }
            </Text>
            {isLoading && <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 16 }} />}
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando líderes...</Text>
        </View>
    );

    if (isLoading && allLideres.length === 0) {
        return renderLoadingState();
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* 🎯 ESTADÍSTICAS CLICKEABLES */}
            <View style={styles.statsContainer}>
                <TouchableOpacity
                    style={[
                        styles.statItem,
                        filter === 'todos' && styles.statItemActive
                    ]}
                    onPress={() => handleStatClick('todos')}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.statNumber,
                        filter === 'todos' && styles.statNumberActive
                    ]}>
                        {estadisticas.total}
                    </Text>
                    <Text style={[
                        styles.statLabel,
                        filter === 'todos' && styles.statLabelActive
                    ]}>
                        Total
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.statItem,
                        filter === 'pendientes' && styles.statItemActive
                    ]}
                    onPress={() => handleStatClick('pendientes')}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.statNumber,
                        styles.pendingNumber,
                        filter === 'pendientes' && styles.statNumberActive
                    ]}>
                        {estadisticas.pendientes}
                    </Text>
                    <Text style={[
                        styles.statLabel,
                        filter === 'pendientes' && styles.statLabelActive
                    ]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.statItem,
                        filter === 'visitados' && styles.statItemActive
                    ]}
                    onPress={() => handleStatClick('visitados')}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.statNumber,
                        styles.completedNumber,
                        filter === 'visitados' && styles.statNumberActive
                    ]}>
                        {estadisticas.visitados}
                    </Text>
                    <Text style={[
                        styles.statLabel,
                        filter === 'visitados' && styles.statLabelActive
                    ]}>
                        Visitados
                    </Text>
                </TouchableOpacity>
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

            {/* Indicador de filtro activo */}
            {filter !== 'todos' && (
                <View style={styles.filterIndicatorContainer}>
                    <View style={styles.filterIndicator}>
                        <Text style={styles.filterIndicatorText}>
                            Mostrando: {filter === 'pendientes' ? 'Líderes Pendientes' : 'Líderes Visitados'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleStatClick('todos')}
                            style={styles.clearFilterButton}
                        >
                            <Text style={styles.clearFilterText}>Mostrar Todos</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Lista filtrada */}
            <FlatList
                data={filteredLideres}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#7f8c8d',
        fontWeight: '500',
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
        paddingVertical: 8,
        borderRadius: 12,
        marginHorizontal: 4,
        // 🎯 Efecto visual para indicar que es clickeable
        backgroundColor: 'transparent',
    },
    statItemActive: {
        backgroundColor: '#e8f4f8',
        borderWidth: 2,
        borderColor: '#3498db',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3498db',
        marginBottom: 4,
    },
    statNumberActive: {
        color: '#2980b9',
        fontSize: 22,
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
        fontWeight: '500',
    },
    statLabelActive: {
        color: '#2980b9',
        fontWeight: '600',
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
    filterIndicatorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    filterIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
    },
    filterIndicatorText: {
        fontSize: 14,
        color: '#2980b9',
        fontWeight: '600',
    },
    clearFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#3498db',
        borderRadius: 12,
    },
    clearFilterText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
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
        marginBottom: 4,
    },
    clientDate: {
        fontSize: 12,
        color: '#27ae60',
        fontStyle: 'italic',
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
    actionButtonDisabled: {
        borderColor: '#bdc3c7',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3498db',
    },
    actionButtonTextPrimary: {
        color: '#fff',
    },
    actionButtonTextDisabled: {
        color: '#bdc3c7',
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