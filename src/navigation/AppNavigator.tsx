import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useUser, UserProvider } from '../context/UserContext';

// Importar pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClientListScreen from '../screens/ClientListScreen';
import MapScreen from '../screens/MapScreen';
import SurveyScreen from '../screens/SurveyScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

// Crear Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

// Pantalla de carga
const LoadingScreen: React.FC = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
    </View>
);

// Navegador autenticado (cuando el usuario está logueado)
const AuthenticatedNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#3498db',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'SurveysGeo',
                    headerLeft: () => null, // Ocultar botón atrás
                }}
            />
            <Stack.Screen
                name="ClientList"
                component={ClientListScreen}
                options={{
                    title: 'Lista de Clientes',
                }}
            />
            <Stack.Screen
                name="Map"
                component={MapScreen}
                options={{
                    title: 'Mapa de Ubicaciones',
                }}
            />
            <Stack.Screen
                name="Survey"
                component={SurveyScreen}
                options={{
                    title: 'Realizar Encuesta',
                }}
            />
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Mi Dashboard',
                }}
            />
        </Stack.Navigator>
    );
};

// Navegador no autenticado (pantalla de login)
const UnauthenticatedNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
};

// Navegador principal que decide qué mostrar
const AppNavigator: React.FC = () => {
    const { isLoading, isAuthenticated } = useUser();

    // Mostrar pantalla de carga mientras verifica autenticación
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AuthenticatedNavigator /> : <UnauthenticatedNavigator />}
        </NavigationContainer>
    );
};

// Componente principal con provider
const AppWithProvider: React.FC = () => {
    return (
        <UserProvider>
            <AppNavigator />
        </UserProvider>
    );
};

const styles = StyleSheet.create({
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
});

export default AppWithProvider;