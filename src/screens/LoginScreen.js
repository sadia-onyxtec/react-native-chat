import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, TouchableOpacity, Image, Text, TextInput } from 'react-native';
import { auth, db } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    addDoc,
    orderBy,
    query,
    doc,
    setDoc,
    onSnapshot, Timestamp, getDoc, getDocs, updateDoc, getCountFromServer
} from 'firebase/firestore';
function LoginScreen({ navigation }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const _continue = async () => {
        if (name !== "" && password !== "") {
            try {
                const new_register = await createUserWithEmailAndPassword(auth, name, password);
                createConversation(new_register)
            } catch (error) {
                Alert.alert("Login error", error.message)
            }

        }
    }
    async function createConversation(new_user) {
        //initializing some variables that would be needed in the below loop
        var conversation_ref;
        var new_conversation;
        var _conversations = new Array;
        const user_ref = collection(db, 'users');
        var conversation_ref_for_id;
        var all_conversation_of_new_user = new Array;
        var users_processed = 0;
        //getting all docs in users collection
        const userSnap = await getDocs(user_ref);

        //getting the count of all docs in user collection
        var count = await getCountFromServer(user_ref);
        count = count.data().count;

        //looping on user docs to create conversation of each user with new;y created user
        //and saving that conversation id in all user docs and in conversation docs
        await userSnap.forEach(async (userDoc, index) => {
            _conversations = [];
            // getting doc reference of conversation collection
            conversation_ref = doc(collection(db, "conversation"));

            //creating a new doc in conversation using the above reference.
            new_conversation = await setDoc(conversation_ref, {
                created_at: Timestamp.fromDate(new Date()),
                created_by: new_user.user.uid,
                first_participant: new_user.user.uid,
                second_participant: userDoc.data().uid,
                recent_message: {
                    sent_by: null,
                    sent_at: null,
                    message_text: null
                },
                id: conversation_ref.id
            },)

            //pushing this new conversation id in the user's conversation array so that
            //we will have the conversation ref id in the user doc too.
            if (userDoc.data().conversation.length > 0) {
                _conversations = userDoc.data().conversation;
            }
            _conversations.push(conversation_ref.id)

            //saving all conversation ids in another array to push it in the new user doc
            all_conversation_of_new_user.push(conversation_ref.id)

            //this query will update the conversation array in user doc on the current index
            await updateDoc(userDoc.ref, { conversation: _conversations });

            // calling save user here because it was being called before the loop was finished
            users_processed++;
            if (users_processed === count) {
                await saveUser(new_user, all_conversation_of_new_user)
            }
        })

        //if count is zero above loop will not work so creating user here if it's the first user
        if (count === 0) {
            await saveUser(new_user, all_conversation_of_new_user)
        }

    }
    async function saveUser(new_register, all_conversation_of_new_user) {
        //creating the auth user in database
        await setDoc(doc(db, 'users', new_register.user.uid), {
            username: new_register.user.email.replace(/@.*$/, ""),
            email: new_register.user.email,
            uid: new_register.user.uid,
            conversation: all_conversation_of_new_user
        })
            .then(() => {
                createMessages(all_conversation_of_new_user).then(() => {
                    navigation.navigate("Home", { name: new_register.user.email.replace(/@.*$/, ""), conversations: all_conversation_of_new_user })
                }).catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
    }

    async function createMessages(conversations) {
        var message_doc_ref;
        //creating messages sub-collection in message collection against conversation ids
        conversations.forEach(async conversation => {
            message_doc_ref = collection(db, 'message', conversation, 'messages');
            await addDoc(message_doc_ref, {}, { merge: true });
        });
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