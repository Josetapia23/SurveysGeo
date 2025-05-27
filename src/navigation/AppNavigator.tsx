import React, { createContext, useContext, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { User } from '../../App';
import { RootStackParamList, UserContextType } from './types';

// Importar pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
//import ClientListScreen from '../screens/ClientListScreen';
//import MapScreen from '../screens/MapScreen';
//import SurveyScreen from '../screens/SurveyScreen';
//import DashboardScreen from '../screens/DashboardScreen';

// Crear Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

// Crear contexto de usuario
const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook para usar el contexto de usuario
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe usarse dentro de UserProvider');
    }
    return context;
};

// Provider de usuario
const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User): void => {
        setUser(userData);
    };

    const logout = (): void => {
        setUser(null);
    };

    const value: UserContextType = {
        user,
        setUser,
        login,
        logout,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

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
            {/* <Stack.Screen
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
            />  */}
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
    const { user } = useUser();

    return (
        <NavigationContainer>
            {user ? <AuthenticatedNavigator /> : <UnauthenticatedNavigator />}
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

export default AppWithProvider;