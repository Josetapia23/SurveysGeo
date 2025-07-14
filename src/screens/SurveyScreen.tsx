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
import ProximityStatus from '../components/ProximityStatus'; // 🔥 NUEVO IMPORT

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

    // 🔥 NUEVO ESTADO PARA PROXIMIDAD
    const [isProximityValid, setIsProximityValid] = useState<boolean>(false);
    const [currentDistance, setCurrentDistance] = useState<number | null>(null);

    // Obtener ubicación GPS independiente (para envío de encuesta)
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async (): Promise<void> => {
        try {
            setIsLoadingLocation(true);
            setLocationError(null);

            console.log('📍 Obteniendo ubicación para encuesta...');

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permisos de ubicación denegados');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 15000,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            setCurrentLocation(coords);
            setLocationError(null);
            console.log('✅ Ubicación para encuesta obtenida:', coords);

        } catch (error) {
            console.error('❌ Error obteniendo ubicación:', error);
            setLocationError('Error obteniendo ubicación GPS');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // 🔥 NUEVA FUNCIÓN - Callback de proximidad
    const handleProximityChange = (isInRange: boolean, distance: number | null): void => {
        console.log(`🎯 Proximidad cambió: ${isInRange ? 'EN RANGO' : 'FUERA DE RANGO'} (${distance}m)`);
        setIsProximityValid(isInRange);
        setCurrentDistance(distance);
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

    // 🔥 VALIDACIÓN MEJORADA - Incluye proximidad
    const canSubmitSurvey = (): boolean => {
        return validateSurvey() &&
            isProximityValid &&
            currentLocation !== null &&
            !isSubmitting;
    };

    const handleSubmit = async (): Promise<void> => {
        // Validación de formulario
        if (!validateSurvey()) {
            Alert.alert(
                'Encuesta Incompleta',
                'Por favor responda todas las preguntas antes de continuar.',
                [{ text: 'OK' }]
            );
            return;
        }

        // 🔥 NUEVA VALIDACIÓN DE PROXIMIDAD
        if (!isProximityValid) {
            const distanceMessage = currentDistance
                ? `Estás a ${currentDistance}m del líder. Necesitas estar a 80m o menos.`
                : 'No estás lo suficientemente cerca del líder.';

            Alert.alert(
                'Fuera de Rango',
                `${distanceMessage}\n\nAcércate más al líder para poder realizar la encuesta.`,
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
🎯 Distancia al líder: ${currentDistance}m (✅ En rango)
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

    // Enviar encuesta a la API real
    const submitSurvey = async (): Promise<void> => {
        setIsSubmitting(true);

        try {
            if (!currentLocation || !client || !user) {
                throw new Error('Datos incompletos para enviar encuesta');
            }

            console.log('📤 Enviando encuesta a la API...');

            const ubicacion = `${currentLocation.latitude},${currentLocation.longitude}`;

            const encuestaData: EncuestaApiData = {
                id_lider: parseInt(client.id),
                pregunta1: surveyData.pregunta1 === 'si' ? 'S' : 'N',
                pregunta2: surveyData.pregunta2 === 'si' ? 'S' : 'N',
                pregunta3: surveyData.pregunta3 === 'si' ? 'S' : 'N',
                ubicacion: ubicacion
            };

            console.log('📋 Datos de encuesta a enviar:', encuestaData);

            const response = await ApiService.post(
                API_CONFIG.ENDPOINTS.ENCUESTAS,
                encuestaData
            );

            if (response.success) {
                console.log('✅ Encuesta enviada exitosamente:', response.data);

                Alert.alert(
                    '✅ Encuesta Enviada',
                    `La encuesta para ${client.nombre} ${client.apellido} ha sido guardada exitosamente.

📍 Ubicación registrada (${currentDistance}m del líder)
📅 Fecha: ${new Date().toLocaleString()}
🆔 ID Encuesta: ${response.data?.id_encuesta || 'N/A'}`,
                    [
                        {
                            text: 'Ver Lista',
                            onPress: () => {
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

    const renderQuestion = (question: typeof questions[0], questionKey: keyof SurveyData) => (
        <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.text}</Text>
            <Text style={styles.questionDescription}>{question.description}</Text>

            <View style={styles.answersContainer}>
                <TouchableOpacity
                    style={[
                        styles.answerButton,
                        surveyData[questionKey] === 'si' && styles.answerButtonSelected,
                        !isProximityValid && styles.answerButtonDisabled // 🔥 DESHABILITADO SI ESTÁ LEJOS
                    ]}
                    onPress={() => handleAnswer(questionKey, 'si')}
                    disabled={isSubmitting || !isProximityValid} // 🔥 NUEVA VALIDACIÓN
                >
                    <Text style={[
                        styles.answerText,
                        surveyData[questionKey] === 'si' && styles.answerTextSelected,
                        !isProximityValid && styles.answerTextDisabled // 🔥 TEXTO DESHABILITADO
                    ]}>
                        ✓ SÍ
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.answerButton,
                        surveyData[questionKey] === 'no' && styles.answerButtonSelected,
                        !isProximityValid && styles.answerButtonDisabled // 🔥 DESHABILITADO SI ESTÁ LEJOS
                    ]}
                    onPress={() => handleAnswer(questionKey, 'no')}
                    disabled={isSubmitting || !isProximityValid} // 🔥 NUEVA VALIDACIÓN
                >
                    <Text style={[
                        styles.answerText,
                        surveyData[questionKey] === 'no' && styles.answerTextSelected,
                        !isProximityValid && styles.answerTextDisabled // 🔥 TEXTO DESHABILITADO
                    ]}>
                        ✗ NO
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // 🔥 FUNCIÓN PARA MENSAJE DEL BOTÓN
    const getSubmitButtonText = (): string => {
        if (isSubmitting) return 'Enviando...';
        if (!isProximityValid && currentDistance) {
            const distanceNeeded = Math.max(0, currentDistance - 80);
            return `Acércate ${distanceNeeded}m más`;
        }
        if (!isProximityValid) return 'Acércate al líder';
        if (!validateSurvey()) return 'Completa todas las preguntas';
        return 'Enviar Encuesta';
    };

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
                {/* 🔥 NUEVO COMPONENTE DE PROXIMIDAD */}
                <ProximityStatus
                    targetLocation={client.coordinates}
                    minDistance={80}
                    onProximityChange={handleProximityChange}
                    style={styles.proximityStatus}
                />

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

                {/* Formulario de encuesta */}
                <View style={styles.surveyContainer}>
                    <Text style={styles.surveyTitle}>Encuesta Electoral</Text>
                    <Text style={styles.surveySubtitle}>
                        {isProximityValid
                            ? 'Por favor responda todas las preguntas'
                            : '⚠️ Acércate al líder para habilitar la encuesta'
                        }
                    </Text>

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
                            !canSubmitSurvey() && styles.submitButtonDisabled // 🔥 NUEVA VALIDACIÓN
                        ]}
                        onPress={handleSubmit}
                        disabled={!canSubmitSurvey()} // 🔥 NUEVA VALIDACIÓN
                    >
                        <Text style={styles.submitButtonText}>
                            {getSubmitButtonText()} {/* 🔥 TEXTO DINÁMICO */}
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
    // 🔥 NUEVO ESTILO
    proximityStatus: {
        marginTop: 0,
        marginBottom: 0,
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
    // 🔥 NUEVOS ESTILOS PARA DESHABILITADO
    answerButtonDisabled: {
        borderColor: '#ecf0f1',
        backgroundColor: '#f8f9fa',
    },
    answerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7f8c8d',
    },
    answerTextSelected: {
        color: '#3498db',
    },
    // 🔥 NUEVO ESTILO
    answerTextDisabled: {
        color: '#bdc3c7',
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