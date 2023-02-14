import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, TouchableOpacity, Image, Text, TextInput } from 'react-native';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
function LoginScreen({ navigation }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const _continue = async () => {
        if (name !== "" && password !== "") {
            try {
                const new_register = await signInWithEmailAndPassword(auth, name, password);
                await updateProfile(auth.currentUser, { photoURL: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" });
            } catch (error) {
                Alert.alert("Login error", error.message)
            }

        }
    }
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.circle}></View>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Email"
                    autoCapitalize='none'
                    placeholderTextColor="#003f5c"
                    onChangeText={(email) => setName(email)}
                />
            </View>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Password"
                    placeholderTextColor="#003f5c"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                />
            </View>
            <TouchableOpacity style={styles.loginBtn} onPress={_continue}>
                <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e5e9f0"
    },
    circle: {
        height: 600,
        aspectRatio: 1,
        borderRadius: 500,
        backgroundColor: "#eceff4",
        position: "absolute",
        top: 0,
        right: -10,
        zIndex: -1
    },
    image: {
        height: 100,
        width: 100,
        alignSelf: "center"

    },
    inputView: {
        backgroundColor: "white",
        borderRadius: 10,
        width: "80%",
        height: 45,
        marginBottom: 20,
        // alignItems: "center",
    },

    TextInput: {
        height: 50,
        flex: 1,
        padding: 10,
        marginLeft: 20,
    },

    forgot_button: {
        height: 30,
        marginBottom: 30,
    },

    loginBtn: {
        width: "80%",
        borderRadius: 10,
        height: 45,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
        backgroundColor: "#88c0d0",
    },

});

export default LoginScreen;