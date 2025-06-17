import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { ApiService, API_CONFIG } from '../services/api';

// Tipos para navegación
type SurveyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Survey'>;
type SurveyScreenRouteProp = RouteProp<RootStackParamList, 'Survey'>;

interface SurveyScreenProps {
    navigation: SurveyScreenNavigationProp;
    route: SurveyScreenRouteProp;
}

type Answer = 'si' | 'no' | null;

interface SurveyData {
    pregunta1: Answer;
    pregunta2: Answer;
    pregunta3: Answer;
}

// Formato que espera la API
interface EncuestaApiData {
    id_lider: number;
    pregunta1: 'S' | 'N';
    pregunta2: 'S' | 'N';
    pregunta3: 'S' | 'N';
    ubicacion: string; // formato: "lat,lng"
}

const SurveyScreen: React.FC<SurveyScreenProps> = ({ navigation, route }) => {
    const { user } = useUser();
    const { clientId, client } = route.params || {};

    const [surveyData, setSurveyData] = useState<SurveyData>({
        pregunta1: null,
        pregunta2: null,
        pregunta3: null,
    });

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number,
        longitude: number
    } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

    // 🔥 OBTENER UBICACIÓN REAL DEL DISPOSITIVO
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async (): Promise<void> => {
        try {
            setIsLoadingLocation(true);
            setLocationError(null);

            console.log('📍 Solicitando permisos de ubicación...');

            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationError('Permisos de ubicación denegados');
                Alert.alert(
                    'Permisos Requeridos',
                    'Esta app necesita acceso a la ubicación para registrar el lugar de la encuesta.',
                    [
                        { text: 'Configuración', onPress: () => Location.requestForegroundPermissionsAsync() },
                        { text: 'Cancelar' }
                    ]
                );
                return;
            }

            console.log('📍 Obteniendo ubicación GPS...');

            // Obtener ubicación actual
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,

            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            setCurrentLocation(coords);
            setLocationError(null);

            console.log('✅ Ubicación obtenida:', coords);
            console.log(`📍 Precisión: ${location.coords.accuracy}m`);

        } catch (error) {
            console.error('❌ Error obteniendo ubicación:', error);
            setLocationError('Error obteniendo ubicación GPS');

            Alert.alert(
                'Error GPS',
                'No se pudo obtener la ubicación. Verifica que el GPS esté activado y tengas conexión.',
                [
                    { text: 'Reintentar', onPress: getCurrentLocation },
                    { text: 'Cancelar' }
                ]
            );
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Preguntas de la encuesta
    const questions = [
        {
            id: 'pregunta1',
            text: '¿Conoce usted al candidato?',
            description: 'Indique si tiene conocimiento sobre el candidato'
        },
        {
            id: 'pregunta2',
            text: '¿Desea apoyar la campaña electoral?',
            description: 'Manifieste su intención de apoyo a la campaña'
        },
        {
            id: 'pregunta3',
            text: '¿Recomendaría el candidato a otros?',
            description: 'Evalúe si recomendaría el candidato en su círculo social'
        }
    ];

    const handleAnswer = (questionId: keyof SurveyData, answer: Answer): void => {
        setSurveyData(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const validateSurvey = (): boolean => {
        return surveyData.pregunta1 !== null &&
            surveyData.pregunta2 !== null &&
            surveyData.pregunta3 !== null;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validateSurvey()) {
            Alert.alert(
                'Encuesta Incompleta',
                'Por favor responda todas las preguntas antes de continuar.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!currentLocation) {
            Alert.alert(
                'Ubicación Requerida',
                'Es necesario obtener la ubicación GPS para completar la encuesta.',
                [
                    { text: 'Reintentar GPS', onPress: getCurrentLocation },
                    { text: 'Cancelar' }
                ]
            );
            return;
        }

        if (!client || !user) {
            Alert.alert('Error', 'Información del líder o usuario no disponible');
            return;
        }

        // Verificar si ya existe una encuesta para este líder
        if (client.status === 'visitado') {
            Alert.alert(
                'Líder ya encuestado',
                'Este líder ya tiene una encuesta registrada. ¿Deseas continuar de todas formas?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Continuar', onPress: () => showConfirmation() }
                ]
            );
            return;
        }

        showConfirmation();
    };

    const showConfirmation = (): void => {
        Alert.alert(
            'Confirmar Encuesta',
            `¿Está seguro de enviar la encuesta para ${client?.nombre} ${client?.apellido}?

📍 Ubicación: ${currentLocation?.latitude.toFixed(6)}, ${currentLocation?.longitude.toFixed(6)}
📅 Fecha: ${new Date().toLocaleString()}

Respuestas:
• Pregunta 1: ${surveyData.pregunta1 === 'si' ? 'SÍ' : 'NO'}
• Pregunta 2: ${surveyData.pregunta2 === 'si' ? 'SÍ' : 'NO'}
• Pregunta 3: ${surveyData.pregunta3 === 'si' ? 'SÍ' : 'NO'}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar y Enviar',
                    onPress: submitSurvey,
                    style: 'default'
                }
            ]
        );
    };

    // 🔥 ENVIAR ENCUESTA A LA API REAL
    const submitSurvey = async (): Promise<void> => {
        setIsSubmitting(true);

        try {
            if (!currentLocation || !client || !user) {
                throw new Error('Datos incompletos para enviar encuesta');
            }

            console.log('📤 Enviando encuesta a la API...');

            // Formato de ubicación que espera la API: "lat,lng"
            const ubicacion = `${currentLocation.latitude},${currentLocation.longitude}`;

            // Convertir respuestas al formato que espera la API
            const encuestaData: EncuestaApiData = {
                id_lider: parseInt(client.id),
                pregunta1: surveyData.pregunta1 === 'si' ? 'S' : 'N',
                pregunta2: surveyData.pregunta2 === 'si' ? 'S' : 'N',
                pregunta3: surveyData.pregunta3 === 'si' ? 'S' : 'N',
                ubicacion: ubicacion
            };

            console.log('📋 Datos de encuesta a enviar:', encuestaData);

            // 🚀 ENVIAR A LA API REAL
            const response = await ApiService.post(
                API_CONFIG.ENDPOINTS.ENCUESTAS,
                encuestaData
            );

            if (response.success) {
                console.log('✅ Encuesta enviada exitosamente:', response.data);

                Alert.alert(
                    '✅ Encuesta Enviada',
                    `La encuesta para ${client.nombre} ${client.apellido} ha sido guardada exitosamente.

📍 Ubicación registrada
📅 Fecha: ${new Date().toLocaleString()}
🆔 ID Encuesta: ${response.data?.encuesta_id || 'N/A'}`,
                    [
                        {
                            text: 'Ver Lista',
                            onPress: () => {
                                // Navegar de vuelta a la lista de líderes
                                navigation.navigate('ClientList');
                            }
                        },
                        {
                            text: 'Ir al Mapa',
                            onPress: () => {
                                navigation.navigate('Map');
                            }
                        }
                    ]
                );
            } else {
                throw new Error(response.message || 'Error guardando encuesta en el servidor');
            }

        } catch (error: any) {
            console.error('❌ Error enviando encuesta:', error);

            let errorMessage = 'Hubo un problema al enviar la encuesta.';

            if (error.message) {
                errorMessage += `\n\nDetalle: ${error.message}`;
            }

            Alert.alert(
                'Error al Enviar',
                errorMessage,
                [
                    { text: 'Reintentar', onPress: submitSurvey },
                    { text: 'Cancelar' }
                ]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderizar estado de ubicación mejorado
    const renderLocationStatus = () => (
        <View style={styles.locationContainer}>
            {isLoadingLocation ? (
                <View style={styles.locationLoading}>
                    <ActivityIndicator size="small" color="#3498db" />
                    <Text style={styles.locationText}>⏳ Obteniendo ubicación GPS...</Text>
                </View>
            ) : locationError ? (
                <View style={styles.locationError}>
                    <Text style={styles.locationErrorText}>❌ {locationError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={getCurrentLocation}
                    >
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : currentLocation ? (
                <View style={styles.locationSuccess}>
                    <Text style={styles.locationText}>
                        ✅ Ubicación obtenida
                    </Text>
                    <Text style={styles.locationCoords}>
                        📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </Text>
                </View>
            ) : (
                <Text style={styles.locationText}>📍 Ubicación no disponible</Text>
            )}
        </View>
    );

    const renderQuestion = (question: typeof questions[0], questionKey: keyof SurveyData) => (
        <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.text}</Text>
            <Text style={styles.questionDescription}>{question.description}</Text>

            <View style={styles.answersContainer}>
                <TouchableOpacity
                    style={[
                        styles.answerButton,
                        surveyData[questionKey] === 'si' && styles.answerButtonSelected
                    ]}
                    onPress={() => handleAnswer(questionKey, 'si')}
                    disabled={isSubmitting}
                >
                    <Text style={[
                        styles.answerText,
                        surveyData[questionKey] === 'si' && styles.answerTextSelected
                    ]}>
                        ✓ SÍ
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.answerButton,
                        surveyData[questionKey] === 'no' && styles.answerButtonSelected
                    ]}
                    onPress={() => handleAnswer(questionKey, 'no')}
                    disabled={isSubmitting}
                >
                    <Text style={[
                        styles.answerText,
                        surveyData[questionKey] === 'no' && styles.answerTextSelected
                    ]}>
                        ✗ NO
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!client) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No se encontró información del líder</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Información del líder */}
                <View style={styles.clientInfoContainer}>
                    <Text style={styles.clientInfoTitle}>Información del Líder</Text>
                    <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.nombre} {client.apellido}</Text>
                        <Text style={styles.clientDetails}>CC: {client.cedula}</Text>
                        <Text style={styles.clientDetails}>📍 {client.direccion}</Text>
                        <Text style={styles.clientDetails}>{client.barrio}, {client.ciudad}</Text>
                        {client.celular && (
                            <Text style={styles.clientDetails}>📞 {client.celular}</Text>
                        )}
                        {client.status === 'visitado' && (
                            <Text style={styles.clientWarning}>
                                ⚠️ Este líder ya fue encuestado anteriormente
                            </Text>
                        )}
                    </View>
                </View>

                {/* Estado de ubicación mejorado */}
                {renderLocationStatus()}

                {/* Formulario de encuesta */}
                <View style={styles.surveyContainer}>
                    <Text style={styles.surveyTitle}>Encuesta Electoral</Text>
                    <Text style={styles.surveySubtitle}>Por favor responda todas las preguntas</Text>

                    {questions.map((question, index) =>
                        renderQuestion(question, `pregunta${index + 1}` as keyof SurveyData)
                    )}
                </View>

                {/* Botones de acción */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!validateSurvey() || isSubmitting || !currentLocation) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!validateSurvey() || isSubmitting || !currentLocation}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Enviando...' : 'Enviar Encuesta'}
                        </Text>
                    </TouchableOpacity>
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
    clientInfoContainer: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clientInfoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 12,
    },
    clientInfo: {
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
        paddingLeft: 12,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 6,
    },
    clientDetails: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    clientWarning: {
        fontSize: 14,
        color: '#f39c12',
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        padding: 8,
        borderRadius: 6,
    },
    locationContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    locationLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8f4f8',
    },
    locationError: {
        alignItems: 'center',
        backgroundColor: '#fee',
    },
    locationErrorText: {
        fontSize: 14,
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    locationSuccess: {
        alignItems: 'center',
        backgroundColor: '#e8f4f8',
    },
    locationText: {
        fontSize: 14,
        color: '#2c3e50',
        textAlign: 'center',
    },
    locationCoords: {
        fontSize: 12,
        color: '#7f8c8d',
        fontFamily: 'monospace',
        marginTop: 4,
    },
    surveyContainer: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    surveyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    surveySubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 24,
    },
    questionContainer: {
        marginBottom: 32,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 6,
    },
    questionDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 16,
    },
    answersContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    answerButton: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    answerButtonSelected: {
        borderColor: '#3498db',
        backgroundColor: '#e8f4f8',
    },
    answerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7f8c8d',
    },
    answerTextSelected: {
        color: '#3498db',
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e74c3c',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e74c3c',
    },
    submitButton: {
        flex: 2,
        backgroundColor: '#27ae60',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#bdc3c7',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 18,
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SurveyScreen;