import React, { JSX } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

// Tipos principales de la app
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'gestor';
}

export interface Client {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  direccion: string;
  celular: string;
  barrio: string;
  ciudad: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  assignedTo: string;
  status: 'pendiente' | 'visitado';
}

export interface Survey {
  id: string;
  clientId: string;
  gestorId: string;
  responses: {
    pregunta1: string;
    pregunta2: string;
    pregunta3: string;
  };
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export default function App(): JSX.Element {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />
      <AppNavigator />
    </>
  );
}