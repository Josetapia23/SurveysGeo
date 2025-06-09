import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

// Tipos para navegación
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

interface Stat {
    number: number;
    label: string;
    color: string;
}

interface MainAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    screen: 'ClientList' | 'Map';
    color: string;
    gradientColors: string[];
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    // Usar contexto de usuario
    const { user, logout } = useUser();

    // Datos mock - después vendrán de Firebase
    const stats: Stat[] = [
        { number: 12, label: 'Clientes Asignados', color: '#3498db' },
        { number: 8, label: 'Pendientes', color: '#f39c12' },
        { number: 4, label: 'Completadas', color: '#27ae60' }
    ];

    const mainActions: MainAction[] = [
        {
            id: 'clients',
            title: 'Lista de Clientes',
            subtitle: 'Ver y gestionar clientes asignados',
            icon: '👥',
            screen: 'ClientList',
            color: '#3498db',
            gradientColors: ['#3498db', '#2980b9']
        },
        {
            id: 'map',
            title: 'Mapa de Ubicaciones',
            subtitle: 'Ubicar clientes y optimizar rutas',
            icon: '🗺️',
            screen: 'Map',
            color: '#27ae60',
            gradientColors: ['#27ae60', '#229954']
        }
    ];

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

            {/* Estadísticas del día */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Resumen del día</Text>
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: stat.color }]}>
                                {stat.number}
                            </Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
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
                            Usa el mapa para planificar tu ruta y visitar clientes cercanos primero
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>SurveysGeo v1.0</Text>
                <Text style={styles.footerSubtext}>Trabajo de campo optimizado</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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