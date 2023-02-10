import React, { useEffect, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, Text, TouchableOpacity } from 'react-native';
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

    useEffect(() => {

    }, [conversationList]);


    const getConversations = async () => {
        var conversation_list = new Array;
        const conversation_ref = collection(db, "conversation");
        const conversation_doc_query_1 = query(conversation_ref, where("first_participant", "==", auth?.currentUser?.uid));
        const conversation_doc_query_2 = query(conversation_ref, where("second_participant", "==", auth?.currentUser?.uid));
        await getDocs(conversation_doc_query_1)
            .then(async (conversation_docs_1) => {
                var count_of_first_participants_list = await getCountFromServer(conversation_doc_query_1);
                count_of_first_participants_list = count_of_first_participants_list.data().count;
                var count_of_second_participants_list = await getCountFromServer(conversation_doc_query_2);
                count_of_second_participants_list = count_of_second_participants_list.data().count;
                await getDocs(conversation_doc_query_2)
                    .then(async (conversation_docs_2) => {
                        conversation_docs_1?.forEach(async conversation_1 => {
                            const conversation_obj = {}
                            const user_ref = doc(db, "users", conversation_1.data().second_participant);
                            await getDoc(user_ref).then((user_doc_for_second_participants) => {
                                conversation_obj['sender'] = user_doc_for_second_participants.data();
                                conversation_obj['conversation'] = conversation_1.data();
                                conversation_list.push(conversation_obj);

                                if (conversation_list.length === count_of_first_participants_list) {

                                    if (count_of_second_participants_list !== 0) {
                                        conversation_docs_2?.forEach(async conversation_2 => {
                                            const conversation_obj_2 = {}
                                            const user_ref_2 = doc(db, "users", conversation_2.data().first_participant);
                                            await getDoc(user_ref_2)
                                                .then((user_doc_for_first_participants) => {
                                                    conversation_obj_2['sender'] = user_doc_for_first_participants.data();
                                                    conversation_obj_2['conversation'] = conversation_2.data();
                                                    conversation_list.push(conversation_obj_2);
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
        //  getConversations()
        getConversations();

        // const collectionRef = collection(db, 'users');
        // const q = query(collectionRef);
        // const unsubscribe = onSnapshot(q, querySnapshot => {
        //     console.log('querySnapshot unsusbscribe');
        //     setUser(
        //         querySnapshot.docs.map((doc, index) => ({
        //             id: doc.data().uid,
        //             username: doc.data().username,
        //             email: doc.data().email
        //         }))
        //     );
        // });
        // console.log(user)
        // return unsubscribe;
    }, []);

    const ListItem = (item) => {
        return (
            <TouchableOpacity activeOpacity={1} style={{ paddingVertical: 20, paddingHorizontal: "4%", alignItems: "center", backgroundColor: "#f8f9fa", borderRadius: 10, marginBottom: "2%", borderWidth: 0.6, borderColor: "#88c0d0", flexDirection: "row", justifyContent: "space-between" }}
                onPress={
                    // onPressConversation
                    () => navigation.navigate("Chat", { headerTitle: item.item.username, user: item.item })
                }>
                <Text style={{ fontSize: 18, fontWeight: "500", color: "black", textTransform: "capitalize" }}>{item.item.sender.username}</Text>
                <Image source={require("../../assets/a.png")} style={{ height: 16, width: 12, }} />
            </TouchableOpacity>
        )
    }
    return (

        <SafeAreaView style={styles.container}>
            {conversationList?.length > 0 && <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, width: "100%", paddingHorizontal: 20, paddingTop: "4%" }}
                data={conversationList}
                renderItem={ListItem}

            // key={(data) => data.id.toString()}
            />}
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