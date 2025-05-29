import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

// Tipos para navegación
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
    navigation: HomeScreenNavigationProp;
}

interface MenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    screen: keyof RootStackParamList;
}

interface Stat {
    number: number;
    label: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    // Usar contexto de usuario
    const { user, logout } = useUser();

    const menuItems: MenuItem[] = [
        {
            id: 'clients',
            title: 'Lista de Clientes',
            subtitle: 'Ver clientes asignados',
            icon: '👥',
            screen: 'ClientList'
        },
        {
            id: 'map',
            title: 'Mapa de Ubicaciones',
            subtitle: 'Ubicar clientes en el mapa',
            icon: '🗺️',
            screen: 'Map'
        },
        {
            id: 'survey',
            title: 'Realizar Encuesta',
            subtitle: 'Encuestar clientes visitados',
            icon: '📝',
            screen: 'Survey'
        },
        {
            id: 'dashboard',
            title: 'Mi Dashboard',
            subtitle: 'Ver progreso y estadísticas',
            icon: '📊',
            screen: 'Dashboard'
        }
    ];

    // Datos mock - después vendrán de Firebase
    const stats: Stat[] = [
        { number: 12, label: 'Clientes Asignados' },
        { number: 8, label: 'Pendientes' },
        { number: 4, label: 'Completadas' }
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

    const handleMenuPress = (screen: keyof RootStackParamList): void => {
        // Navegación tipada
        if (screen === 'Survey') {
            navigation.navigate('Survey', {});
        } else if (screen === 'ClientList') {
            navigation.navigate('ClientList');
        } else if (screen === 'Map') {
            navigation.navigate('Map');
        } else if (screen === 'Dashboard') {
            navigation.navigate('Dashboard');
        }
    };

    // Si no hay usuario, no renderizar nada (no debería pasar)
    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header personalizado */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>¡Hola!</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* Estadísticas rápidas */}
            <View style={styles.statsContainer}>
                {stats.map((stat, index) => (
                    <View key={index} style={styles.statCard}>
                        <Text style={styles.statNumber}>{stat.number}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* Menú principal */}
            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>¿Qué quieres hacer hoy?</Text>

                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.screen)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <View style={styles.menuText}>
                                <Text style={styles.menuItemTitle}>{item.title}</Text>
                                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    SurveysGeo v1.0
                </Text>
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
    greeting: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e74c3c',
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3498db',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    menuArrow: {
        fontSize: 20,
        color: '#bdc3c7',
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#95a5a6',
    },
});

export default HomeScreen;