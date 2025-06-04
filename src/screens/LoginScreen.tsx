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

// Tipos para la respuesta de la API
interface LoginResponse {
    success: boolean;
    data?: {
        gestor_id: string;
        nombre: string;
        apellido: string;
        email: string;
        cedula?: string;
        telefono?: string;
    };
    message?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState<string>('juan.perez@surveysgeo.com');
    const [password, setPassword] = useState<string>('123456');
    const [loading, setLoading] = useState<boolean>(false);

    // Usar contexto de usuario
    const { login } = useUser();

    // ⚙️ CONFIGURACIÓN DE LA API
    // URL exacta de PHPRunner
    const API_BASE_URL = 'http://192.168.2.117/Surveysgeo/output';

    const handleLogin = async (): Promise<void> => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);

        try {
            // Llamar a la API de PHPRunner
            const response = await fetch(`${API_BASE_URL}/login.php?page=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    btnSubmit: 'Login',
                    username: email,
                    password: password,
                }).toString()
            });

            console.log('Status:', response.status);
            console.log('Response Headers:', response.headers);

            if (response.ok) {
                // Si el login es exitoso, PHPRunner redirecciona
                // Verificamos si nos redirigió a una página diferente
                const finalUrl = response.url;
                console.log('Final URL:', finalUrl);

                if (finalUrl.includes('menu.php') || finalUrl.includes('main') || finalUrl.includes('dashboard') || !finalUrl.includes('login')) {
                    // Login exitoso - crear usuario con datos del gestor real
                    const userData: User = {
                        id: '1', // ID del gestor Juan Carlos
                        email: email,
                        name: email.includes('juan') ? 'Juan Carlos Pérez' : 'María Fernanda García',
                        role: 'gestor'
                    };

                    login(userData);
                    Alert.alert('Éxito', 'Login exitoso con PHPRunner');
                } else {
                    // Login fallido
                    Alert.alert('Error', 'Credenciales incorrectas');
                }
            } else {
                Alert.alert('Error', `Error del servidor: ${response.status}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            Alert.alert(
                'Error de Conexión',
                'No se pudo conectar al servidor. Verifica:\n' +
                '• Que PHPRunner esté ejecutándose\n' +
                '• La dirección IP sea correcta\n' +
                '• Ambos dispositivos estén en la misma red'
            );
        } finally {
            setLoading(false);
        }
    };

    // Función auxiliar para extraer nombre del email
    const extractNameFromEmail = (email: string): string => {
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1).replace('.', ' ');
    };

    const handleForgotPassword = (): void => {
        Alert.alert(
            'Recuperar Contraseña',
            'Contacta al administrador para recuperar tu contraseña',
            [{ text: 'OK' }]
        );
    };

    // Función para probar conexión
    const testConnection = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login.php?page=login`, {
                method: 'GET'
            });

            if (response.ok) {
                Alert.alert('Conexión OK', 'Se puede conectar al servidor PHPRunner');
            } else {
                Alert.alert('Error', `Servidor responde con error: ${response.status}`);
            }
        } catch (error) {
            Alert.alert('Error', 'No se puede conectar al servidor');
        } finally {
            setLoading(false);
        }
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
                        <Text style={styles.description}>Conectado a PHPRunner</Text>
                    </View>

                    {/* Configuración de red */}
                    <View style={styles.networkInfo}>
                        <Text style={styles.networkTitle}>Servidor:</Text>
                        <Text style={styles.networkUrl}>{API_BASE_URL}</Text>
                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={testConnection}
                            disabled={loading}
                        >
                            <Text style={styles.testButtonText}>Probar Conexión</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Formulario */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="juan.perez@surveysgeo.com"
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
                                {loading ? 'Conectando...' : 'Ingresar con PHPRunner'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Datos de prueba */}
                    <View style={styles.testData}>
                        <Text style={styles.testDataTitle}>Datos de PHPRunner:</Text>
                        <Text style={styles.testDataText}>juan.perez@surveysgeo.com</Text>
                        <Text style={styles.testDataText}>Password: 123456</Text>
                        <Text style={styles.testDataSmall}>
                            Hash BD: e10adc3949ba59abbe56e057f20f883e
                        </Text>
                    </View>

                    {/* Instrucciones de red */}
                    <View style={styles.instructions}>
                        <Text style={styles.instructionsTitle}>💡 Configuración:</Text>
                        <Text style={styles.instructionsText}>
                            1. Cambia API_BASE_URL por la IP de tu PC{'\n'}
                            2. Asegúrate que PHPRunner esté ejecutándose{'\n'}
                            3. Ambos dispositivos en la misma red WiFi
                        </Text>
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
        marginBottom: 30,
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
        color: '#27ae60',
        fontWeight: '500',
    },
    networkInfo: {
        backgroundColor: '#e8f4f8',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    networkTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    networkUrl: {
        fontSize: 12,
        color: '#3498db',
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    testButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    form: {
        marginBottom: 20,
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
        backgroundColor: '#27ae60',
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
        backgroundColor: '#e8f5e8',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    testDataTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    testDataText: {
        fontSize: 12,
        color: '#27ae60',
        marginBottom: 2,
        fontWeight: '500',
    },
    testDataSmall: {
        fontSize: 10,
        color: '#7f8c8d',
        fontFamily: 'monospace',
        marginTop: 4,
    },
    instructions: {
        padding: 16,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 12,
        color: '#856404',
        lineHeight: 16,
    },
});

export default LoginScreen;