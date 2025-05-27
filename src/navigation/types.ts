
import { User, Client } from '../../App';

// Definir todas las rutas de la app
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ClientList: undefined;
  Map: undefined;
  Survey: {
    clientId?: string;
    client?: Client;
  };
  Dashboard: undefined;
};

// Tipos para las props de navegación
export type NavigationProps = {
  navigation: any; // Será tipado específicamente en cada screen
  route: any;
};

// Contexto de usuario global
export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
}