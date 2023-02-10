import React, { useState, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity, Text, Image } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from "./config/firebase";
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';


const Stack = createStackNavigator();
const AuthenticatedUserContext = createContext({});

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

function ChatStack() {

  const onSignOut = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
  };

  return (
    <Stack.Navigator >
      <Stack.Screen name='Home' component={HomeScreen} options={{
        headerRight: () => (
          <TouchableOpacity
            style={{
              marginRight: 10
            }}
            onPress={onSignOut}
          >
            <Image source={require("./assets/logout.png")} style={{ width: 20, height: 18, marginRight: 10 }} />
          </TouchableOpacity>
        ),
      }} />
      <Stack.Screen name='Chat' component={ChatScreen} options={({ route }) => ({ title: route.params?.headerTitle }),
      {
        headerTitleStyle: {
          textTransform: "capitalize"
        }
      }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Login' component={LoginScreen} />

    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser } = useContext(AuthenticatedUserContext);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    // onAuthStateChanged returns an unsubscriber
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async authenticatedUser => {
        authenticatedUser ? setUser(authenticatedUser) : setUser(null);
        setIsLoading(false);
      }
    );
    // unsubscribe auth listener on unmount
    return unsubscribeAuth;
  }, [user]);
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <ChatStack /> : <AuthStack />}
      {/* <AuthStack /> */}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthenticatedUserProvider>
      <RootNavigator />
    </AuthenticatedUserProvider>
  );
}