import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { ApiService, API_CONFIG, LiderResponse } from '../services/api';

// Tipos para navegación
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

interface EstadisticasGestor {
    total: number;
    pendientes: number;
    visitados: number;
    porcentaje_completado: number;
}

interface MainAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    screen: 'ClientList' | 'Map';
    color: string;
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const { user, logout } = useUser();
    const [estadisticas, setEstadisticas] = useState<EstadisticasGestor>({
        total: 0,
        pendientes: 0,
        visitados: 0,
        porcentaje_completado: 0
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const mainActions: MainAction[] = [
        {
            id: 'clients',
            title: 'Lista de Clientes',
            subtitle: 'Ver y gestionar clientes asignados',
            icon: '👥',
            screen: 'ClientList',
            color: '#3498db'
        },
        {
            id: 'map',
            title: 'Mapa de Ubicaciones',
            subtitle: 'Ubicar clientes y optimizar rutas',
            icon: '🗺️',
            screen: 'Map',
            color: '#27ae60'
        }
    ];

    // Cargar estadísticas del gestor
    const cargarEstadisticas = async (mostrarRefresh = false): Promise<void> => {
        try {
            if (mostrarRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            console.log('📊 Cargando estadísticas del gestor...');

            const response = await ApiService.get<{
                lideres: LiderResponse[];
                statistics: EstadisticasGestor;
            }>(API_CONFIG.ENDPOINTS.LIDERES);

            if (response.success && response.data) {
                setEstadisticas(response.data.statistics);
                console.log('✅ Estadísticas cargadas:', response.data.statistics);
            } else {
                throw new Error(response.message || 'Error obteniendo estadísticas');
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            Alert.alert(
                'Error',
                'No se pudieron cargar las estadísticas. Verifica tu conexión.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Cargar datos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            cargarEstadisticas();
        }, [])
    );

    // Función para refrescar
    const onRefresh = useCallback(() => {
        cargarEstadisticas(true);
    }, []);

    const handleLogout = (): void => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    onPress: logout,
                    style: 'destructive'
                }
            ]
        );
    };

    const handleActionPress = (screen: 'ClientList' | 'Map'): void => {
        navigation.navigate(screen);
    };

    // Si no hay usuario, no renderizar nada (no debería pasar)
    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header con información del usuario */}
                <View style={styles.header}>
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>¡Hola!</Text>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.roleText}>Gestor de Encuestas</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutIcon}>👋</Text>
                    </TouchableOpacity>
                </View>

                {/* Estadísticas del gestor */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>
                        {isLoading ? 'Cargando estadísticas...' : 'Resumen del día'}
                    </Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#3498db' }]}>
                                {estadisticas.total}
                            </Text>
                            <Text style={styles.statLabel}>Clientes Asignados</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#f39c12' }]}>
                                {estadisticas.pendientes}
                            </Text>
                            <Text style={styles.statLabel}>Pendientes</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#27ae60' }]}>
                                {estadisticas.visitados}
                            </Text>
                            <Text style={styles.statLabel}>Completadas</Text>
                        </View>
                    </View>

                    {/* Progreso */}
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressTitle}>Progreso del día</Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${estadisticas.porcentaje_completado}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {estadisticas.porcentaje_completado}% completado
                        </Text>
                    </View>
                </View>

                {/* Acciones principales */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>¿Qué vas a hacer?</Text>
                    <Text style={styles.sectionSubtitle}>
                        Selecciona una opción para comenzar tu trabajo
                    </Text>

                    <View style={styles.actionsContainer}>
                        {mainActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.actionCard, { borderLeftColor: action.color }]}
                                onPress={() => handleActionPress(action.screen)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.actionContent}>
                                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                                        <Text style={styles.actionIconText}>{action.icon}</Text>
                                    </View>
                                    <View style={styles.actionText}>
                                        <Text style={styles.actionTitle}>{action.title}</Text>
                                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                                    </View>
                                    <View style={styles.actionArrow}>
                                        <Text style={styles.arrowText}>›</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recordatorio útil */}
                <View style={styles.reminderSection}>
                    <View style={styles.reminderCard}>
                        <Text style={styles.reminderIcon}>💡</Text>
                        <View style={styles.reminderText}>
                            <Text style={styles.reminderTitle}>Consejo del día</Text>
                            <Text style={styles.reminderSubtitle}>
                                {estadisticas.pendientes > 0
                                    ? `Tienes ${estadisticas.pendientes} clientes pendientes. Usa el mapa para planificar tu ruta.`
                                    : '¡Felicidades! Has completado todas tus encuestas del día.'
                                }
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>SurveysGeo v1.0</Text>
                    <Text style={styles.footerSubtext}>Conectado a API real</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    welcomeSection: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginVertical: 2,
    },
    roleText: {
        fontSize: 14,
        color: '#3498db',
        fontWeight: '500',
    },
    logoutButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutIcon: {
        fontSize: 20,
    },
    statsSection: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        textAlign: 'center',
        fontWeight: '500',
    },
    progressContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#ecf0f1',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#27ae60',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    actionsSection: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    actionsContainer: {
        gap: 16,
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionIconText: {
        fontSize: 24,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        lineHeight: 20,
    },
    actionArrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 24,
        color: '#bdc3c7',
        fontWeight: 'bold',
    },
    reminderSection: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    reminderCard: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    reminderIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    reminderText: {
        flex: 1,
    },
    reminderTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 2,
    },
    reminderSubtitle: {
        fontSize: 12,
        color: '#856404',
        lineHeight: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: '600',
    },
    footerSubtext: {
        fontSize: 10,
        color: '#bdc3c7',
        marginTop: 2,
    },
});

export default HomeScreen;