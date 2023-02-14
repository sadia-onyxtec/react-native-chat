import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Bubble, GiftedChat } from 'react-native-gifted-chat';
import {
    collection,
    addDoc,
    orderBy,
    query,
    onSnapshot,
    doc,
    getDoc,
    collectionGroup,
    getDocs,
    setDoc
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
function ChatScreen({ navigation, route }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    var conversation = route.params.conversation.conversation;

    useLayoutEffect(() => {
        setIsLoading(true)
        const collectionRef = collection(db, 'message', conversation.id, "messages");
        const queryRef = query(collectionRef, orderBy('sent_at', 'desc'));
        var obj = {};
        const unsubscribe = onSnapshot(queryRef, (snapshot) => setMessages(
            snapshot.docs.map(doc => ({
                // obj['_id']: doc.data().sent_by,
                _id: doc.data().id,
                createdAt: doc.data().sent_at.toDate(),
                user: { "_id": doc.data().sent_by },
                text: doc.data().message_text,
                // image: doc.data().image,
                // video: doc.data().video
            }))
        ));
        setIsLoading(false);
        return () => {
            unsubscribe();
            setIsLoading(false);
        };
    }, []);

    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        const { _id, createdAt, user } = messages[0];
        setDoc(doc(db, 'message', conversation.id, "messages", _id), { id: _id, sent_at: createdAt, message_text: messages[0].text, sent_by: user._id });
    }, []);

    function renderBubble(props) {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    left: {
                        backgroundColor: '#88c0d0',
                    },
                }}
            />
        );
    }
    function renderAvatar(props) {
        return (
            <Avatar
                {...props}

            />
        );
    }
    return (
        <View style={{ flex: 1 }}>
            {isLoading ? <ActivityIndicator color={"#88c0d0"} size="large" /> :
                <GiftedChat
                    messages={messages}
                    onSend={messages => onSend(messages)}
                    renderBubble={renderBubble}
                    renderAvatar={renderAvatar}
                    textInputStyle={{
                        backgroundColor: '#fff',
                    }}
                    user={{
                        _id: auth?.currentUser?.uid,
                        avatar: auth?.currentUser?.photoURL
                    }}
                />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {}
});

export default ChatScreen;