import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { User } from '../../App';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

// Tipos para navegación
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

interface MockUser {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'gestor';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Usar contexto de usuario
    const { login } = useUser();

    // Datos de prueba de gestores (después vendrán de Firebase)
    const mockUsers: MockUser[] = [
        {
            id: 'gestor1',
            email: 'juan@company.com',
            password: '123456',
            name: 'Juan Pérez',
            role: 'gestor'
        },
        {
            id: 'gestor2',
            email: 'maria@company.com',
            password: '123456',
            name: 'María García',
            role: 'gestor'
        }
    ];

    const handleLogin = async (): Promise<void> => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);

        // Simular delay de autenticación
        setTimeout(() => {
            const user = mockUsers.find(
                u => u.email === email.toLowerCase().trim() && u.password === password
            );

            if (user) {
                // Login exitoso - convertir MockUser a User
                const userData: User = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };

                // Usar contexto para login (automáticamente navega a Home)
                login(userData);
            } else {
                Alert.alert('Error', 'Credenciales incorrectas');
            }

            setLoading(false);
        }, 1000);
    };

    const handleForgotPassword = (): void => {
        Alert.alert(
            'Recuperar Contraseña',
            'Funcionalidad de recuperación de contraseña (próximamente con Firebase Auth)',
            [{ text: 'OK' }]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardContainer}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>SurveysGeo</Text>
                        <Text style={styles.subtitle}>Control de Visitas</Text>
                        <Text style={styles.description}>Ingresa a tu cuenta</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ejemplo@company.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                            disabled={loading}
                        >
                            <Text style={styles.forgotPasswordText}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? 'Ingresando...' : 'Ingresar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Datos de prueba */}
                    <View style={styles.testData}>
                        <Text style={styles.testDataTitle}>Datos de Prueba:</Text>
                        <Text style={styles.testDataText}>juan@company.com - 123456</Text>
                        <Text style={styles.testDataText}>maria@company.com - 123456</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3498db',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    form: {
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    forgotPassword: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#3498db',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#3498db',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    testData: {
        padding: 16,
        backgroundColor: '#e8f4f8',
        borderRadius: 8,
        alignItems: 'center',
    },
    testDataTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    testDataText: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 2,
    },
});

export default LoginScreen;