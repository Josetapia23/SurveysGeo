import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { Survey } from '../../App';

// Tipos para navegación
type SurveyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Survey'>;
type SurveyScreenRouteProp = RouteProp<RootStackParamList, 'Survey'>;

interface SurveyScreenProps {
    navigation: SurveyScreenNavigationProp;
    route: SurveyScreenRouteProp;
}

type Answer = 'si' | 'no' | null;

interface SurveyData {
    pregunta1: Answer; // ¿Conoce el candidato?
    pregunta2: Answer; // ¿Desea apoyar la campaña?
    pregunta3: Answer; // Pregunta adicional (por si se necesita)
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
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Simulación de obtener ubicación (después usaremos expo-location)
    useEffect(() => {
        // Simular obtención de GPS
        setTimeout(() => {
            setCurrentLocation({
                latitude: 10.9639 + (Math.random() - 0.5) * 0.01, // Variación pequeña en Barranquilla
                longitude: -74.7964 + (Math.random() - 0.5) * 0.01
            });
        }, 1000);
    }, []);

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
                'Obteniendo Ubicación',
                'Esperando la ubicación GPS. Por favor intente en un momento.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!client || !user) {
            Alert.alert('Error', 'Información del cliente o usuario no disponible');
            return;
        }

        Alert.alert(
            'Confirmar Encuesta',
            `¿Está seguro de enviar la encuesta para ${client.nombre} ${client.apellido}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: submitSurvey,
                    style: 'default'
                }
            ]
        );
    };

    const submitSurvey = async (): Promise<void> => {
        setIsSubmitting(true);

        try {
            // Crear objeto de encuesta
            const survey: Survey = {
                id: `survey_${client?.id}_${Date.now()}`,
                clientId: client?.id || '',
                gestorId: user?.id || '',
                responses: {
                    pregunta1: surveyData.pregunta1 || 'no',
                    pregunta2: surveyData.pregunta2 || 'no',
                    pregunta3: surveyData.pregunta3 || 'no',
                },
                timestamp: new Date().toISOString(),
                location: currentLocation || { latitude: 0, longitude: 0 }
            };

            // Simular guardado (después será Firebase)
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Encuesta guardada:', survey);

            Alert.alert(
                'Encuesta Enviada',
                'La encuesta ha sido guardada exitosamente.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navegar de vuelta a la lista de clientes
                            navigation.navigate('ClientList');
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error al guardar encuesta:', error);
            Alert.alert(
                'Error',
                'Hubo un problema al guardar la encuesta. Intente nuevamente.',
                [{ text: 'OK' }]
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
                    <Text style={styles.errorText}>No se encontró información del cliente</Text>
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
                {/* Información del cliente */}
                <View style={styles.clientInfoContainer}>
                    <Text style={styles.clientInfoTitle}>Información del Cliente</Text>
                    <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.nombre} {client.apellido}</Text>
                        <Text style={styles.clientDetails}>CC: {client.cedula}</Text>
                        <Text style={styles.clientDetails}>📍 {client.direccion}</Text>
                        <Text style={styles.clientDetails}>{client.barrio}, {client.ciudad}</Text>
                        <Text style={styles.clientDetails}>📞 {client.celular}</Text>
                    </View>
                </View>

                {/* Estado de ubicación */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationText}>
                        📍 Ubicación: {currentLocation ? '✅ Obtenida' : '⏳ Obteniendo GPS...'}
                    </Text>
                </View>

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
                            (!validateSurvey() || isSubmitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!validateSurvey() || isSubmitting}
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
    locationContainer: {
        backgroundColor: '#e8f4f8',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    locationText: {
        fontSize: 14,
        color: '#2c3e50',
        textAlign: 'center',
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