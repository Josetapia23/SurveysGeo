import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type SurveyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Survey'>;
type SurveyScreenRouteProp = RouteProp<RootStackParamList, 'Survey'>;

interface SurveyScreenProps {
    navigation: SurveyScreenNavigationProp;
    route: SurveyScreenRouteProp;
}

const SurveyScreen: React.FC<SurveyScreenProps> = ({ navigation, route }) => {
    const { clientId, client } = route.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>📝 Realizar Encuesta</Text>
                <Text style={styles.subtitle}>Próximamente...</Text>
                {client && (
                    <Text style={styles.description}>
                        Cliente: {client.nombre} {client.apellido}
                    </Text>
                )}
                <Text style={styles.description}>
                    Aquí se mostrará el formulario de encuesta con las 3 preguntas obligatorias.
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#3498db',
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export { SurveyScreen };