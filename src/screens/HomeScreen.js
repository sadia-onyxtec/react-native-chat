import React, { useEffect, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
    collection,
    addDoc,
    orderBy,
    query,
    doc,
    where,
    onSnapshot, Firestore, getDoc, getDocs, getCountFromServer
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FlatList } from 'react-native-gesture-handler';
import { auth } from '../../config/firebase';

function HomeScreen({ navigation, route }) {

    const [user, setUser] = useState([]);
    const [conversationList, setConversationList] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (conversationList !== null) {
            setIsLoading(false)
        }
    }, [conversationList]);


    const getConversations = async () => {
        var conversation_list = new Array;

        //getting ref of conversation collection
        const conversation_ref = collection(db, "conversation");

        //query to get conversations where first participant was auth user
        const conversation_doc_query_1 = query(conversation_ref, where("first_participant", "==", auth?.currentUser?.uid));

        //query to get conversations where second participant was auth user
        const conversation_doc_query_2 = query(conversation_ref, where("second_participant", "==", auth?.currentUser?.uid));

        //getting docs of first participant reference
        await getDocs(conversation_doc_query_1)
            .then(async (conversation_docs_1) => {

                //getting count of both docs to run the last function at the end of loop
                var count_of_first_participants_list = await getCountFromServer(conversation_doc_query_1);
                count_of_first_participants_list = count_of_first_participants_list.data().count;
                var count_of_second_participants_list = await getCountFromServer(conversation_doc_query_2);
                count_of_second_participants_list = count_of_second_participants_list.data().count;

                //getting docs of second participant reference
                await getDocs(conversation_doc_query_2)
                    .then(async (conversation_docs_2) => {

                        //looping on first participant list
                        conversation_docs_1?.forEach(async conversation_1 => {
                            const conversation_obj = {}

                            //getting second participant -users in those conversations where auth user was first participant
                            const user_ref = doc(db, "users", conversation_1.data().second_participant);
                            await getDoc(user_ref).then((user_doc_for_second_participants) => {

                                //setting data in useState variable
                                conversation_obj['sender'] = user_doc_for_second_participants.data();
                                conversation_obj['conversation'] = conversation_1.data();
                                conversation_list.push(conversation_obj);

                                //checking if we have reached the end of the loop
                                if (conversation_list.length === count_of_first_participants_list) {

                                    //checking if the second participant reference doc is empty or not
                                    if (count_of_second_participants_list !== 0) {

                                        //looping on the second participant reference doc if it's not empty
                                        conversation_docs_2?.forEach(async conversation_2 => {
                                            const conversation_obj_2 = {}

                                            //getting first participant -users in those conversations where auth user was second participant
                                            const user_ref_2 = doc(db, "users", conversation_2.data().first_participant);
                                            await getDoc(user_ref_2)
                                                .then((user_doc_for_first_participants) => {

                                                    //setting data in useState variable
                                                    conversation_obj_2['sender'] = user_doc_for_first_participants.data();
                                                    conversation_obj_2['conversation'] = conversation_2.data();
                                                    conversation_list.push(conversation_obj_2);

                                                    //checking if we have reached the end of the loop
                                                    if (conversation_list.length === count_of_second_participants_list) {
                                                        setConversationList(conversation_list);
                                                    }
                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                })
                                        })
                                    }
                                    else {
                                        //setting data whatever we have for first participants if second participant reference doc is empty
                                        setConversationList(conversation_list);
                                    }
                                }
                            }).catch((err) => {
                                console.log(err)
                            })
                        });
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            })
            .catch((error) => {
                console.log(error)
            })

    }
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'users'),
            snapshot => {
                getConversations();
            })
        return unsubscribe;
    }, []);

    const ListItem = (item) => {
        return (
            <TouchableOpacity activeOpacity={1} style={{ paddingVertical: 20, paddingHorizontal: "4%", alignItems: "center", backgroundColor: "#f8f9fa", borderRadius: 10, marginBottom: "2%", borderWidth: 0.6, borderColor: "#88c0d0", flexDirection: "row", justifyContent: "space-between" }}
                onPress={
                    () => navigation.navigate("Chat", { headerTitle: item.item.sender.username, conversation: item.item })
                }>
                <Text style={{ fontSize: 18, fontWeight: "500", color: "black", textTransform: "capitalize" }}>{item.item.sender.username}</Text>
                <Image source={require("../../assets/a.png")} style={{ height: 16, width: 12, }} />
            </TouchableOpacity>
        )
    }
    return (

        <SafeAreaView style={styles.container}>
            {!isLoading ? <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, width: "100%", paddingHorizontal: 20, paddingTop: "4%" }}
                data={conversationList}
                renderItem={ListItem}
            /> : <ActivityIndicator color={"#88c0d0"} size="large" />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, justifyContent: "center",
        // alignItems: "center",
        width: "100%",
        // backgroundColor: "#88c0d0"
    }
});

export default HomeScreen;