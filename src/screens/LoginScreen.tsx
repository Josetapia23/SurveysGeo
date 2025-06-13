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
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';

// Tipos para navegación
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [usuario, setUsuario] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { login, isLoading } = useUser();

    const handleLogin = async (): Promise<void> => {
        if (!usuario.trim() || !password.trim()) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        try {
            await login(usuario.trim(), password.trim());
            // Si llega aquí, el login fue exitoso
            // La navegación se maneja automáticamente en AppNavigator
        } catch (error) {
            // Mostrar error al usuario
            const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
            Alert.alert('Error de Login', errorMessage);
        }
    };

    const handleForgotPassword = (): void => {
        Alert.alert(
            'Recuperar Contraseña',
            'Contacta al administrador para recuperar tu contraseña.',
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
                            <Text style={styles.label}>Usuario</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="usuario@email.com"
                                value={usuario}
                                onChangeText={setUsuario}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
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
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                            disabled={isLoading}
                        >
                            <Text style={styles.forgotPasswordText}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>
                                {isLoading ? 'Ingresando...' : 'Ingresar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Datos de prueba */}
                    <View style={styles.testData}>
                        <Text style={styles.testDataTitle}>Datos de Prueba:</Text>
                        <Text style={styles.testDataText}>pendiente@gmail - 12345</Text>
                        <Text style={styles.testDataSubtext}>
                            Usuario: Santiago Campbell
                        </Text>
                    </View>

                    {/* Información de la API */}
                    <View style={styles.apiInfo}>
                        <Text style={styles.apiInfoText}>
                            Conectado a API local
                        </Text>
                        <Text style={styles.apiInfoSubtext}>
                            localhost/surveys-api
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
        color: '#7f8c8d',
        marginBottom: 2,
        fontFamily: 'monospace',
    },
    testDataSubtext: {
        fontSize: 10,
        color: '#95a5a6',
        fontStyle: 'italic',
    },
    apiInfo: {
        padding: 12,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    apiInfoText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 2,
    },
    apiInfoSubtext: {
        fontSize: 10,
        color: '#856404',
        fontFamily: 'monospace',
    },
});

export default LoginScreen;