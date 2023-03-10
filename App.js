import React, { useState, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity, Text, Image } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from "./config/firebase";
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import PushNotification from "react-native-push-notification";

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
      <Stack.Screen name='SignUp' component={SignUpScreen} />
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
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);

        // process the notification here

        // required on iOS only 
        // notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      // Android only
      senderID: "877788395377",
      // iOS only
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },
      popInitialNotification: true,
      requestPermissions: true
    });
  }, []);
  return (
    <AuthenticatedUserProvider>
      <RootNavigator />
    </AuthenticatedUserProvider>
  );
}