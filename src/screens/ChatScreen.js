import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react"
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView } from "react-native"
import { GiftedChat, InputToolbar, Bubble } from "react-native-gifted-chat"

import ChatMessageBox from "./components/ChatMessageBox"
import ReplyMessageBar from "./components/ReplyMessageBar"
import {
  collection,
  orderBy,
  query,
  onSnapshot,
  doc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
const ChatScreen = ({ route, navigation }) => {
  const [replyMessage, setReplyMessage] = useState(null);
  //using ref for swiping a message because user can only 
  //swipe one message at a time.
  const swipeableRowRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true);
  var conversation = route.params.conversation.conversation;
  const [messages, setMessages] = useState([])

  const clearReplyMessage = () => setReplyMessage(null)

  useLayoutEffect(() => {
    setIsLoading(true)
    const collectionRef = collection(db, 'message', conversation.id, "messages");
    const queryRef = query(collectionRef, orderBy('sent_at', 'desc'));
    var obj = {};
    const unsubscribe = onSnapshot(queryRef, (snapshot) => setMessages(
      snapshot.docs.map(doc => ({
        _id: doc.data().id,
        createdAt: doc.data().sent_at.toDate(),
        user: doc.data().sent_by,
        text: doc.data().message_text,
        replyMessage: doc.data().replyMessage ? doc.data().replyMessage : null,
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

  const onSend = useCallback(
    (messages = []) => {
      //setting replyMessage to the parent of the message text 
      if (replyMessage) {
        messages[0].replyMessage = {
          text: replyMessage.text,
          replyTo: replyMessage._id
        }
      }
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, messages)
      );
      const { _id, createdAt, user } = messages[0];
      setDoc(doc(db, 'message', conversation.id, "messages", _id), { id: _id, sent_at: createdAt, message_text: messages[0].text, sent_by: user, replyMessage: messages[0].replyMessage ? messages[0].replyMessage : null });
      setReplyMessage(null)
    },
    [replyMessage]
  )

  const renderCustomInputToolbar = props => (
    //rendering it as custom because the renderAccessory is shown below the 
    //message input field so here I am changing the style to make renderAccessory
    //go above input field
    <InputToolbar
      {...props}
      containerStyle={styles.inputContainer}
      accessoryStyle={styles.replyBarContainer}
    />
  )

  const renderAccessory = () =>
    //if it's a reply message then render a bar above message input box
    replyMessage && (
      <ReplyMessageBar message={replyMessage} clearReply={clearReplyMessage} />
    )

  const updateRowRef = useCallback(
    //saving the currently swiped message into the swipeableRowRef 
    ref => {
      if (
        ref &&
        replyMessage &&
        ref.props.children.props.currentMessage?._id === replyMessage._id
      ) {
        swipeableRowRef.current = ref
      }
    },
    [replyMessage]
  )

  const renderMessageBox = props => (
    //rendering custom message text bubble to swipe it for replying
    <ChatMessageBox
      {...props}
      setReplyOnSwipeOpen={setReplyMessage}
      updateRowRef={updateRowRef}
    />
  )

  useEffect(() => {
    //when reply message is changed check if replyMessage is set
    //then, close opened swiped row (hide reply icon)
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close()
      swipeableRowRef.current = null
    }
  }, [replyMessage])

  const renderReplyMessageView = (props) =>
    //Bubble design if reply message exists
    props.currentMessage &&
    props.currentMessage.replyMessage && (
      <View style={styles.replyMessageContainer}>
        <Text>{props.currentMessage.replyMessage.text}</Text>
        <View style={styles.replyMessageDivider} />
      </View>
    )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: auth?.currentUser?.uid,
          avatar: auth?.currentUser?.photoURL
        }}
        wrapInSafeArea={false}
        isKeyboardInternallyHandled={false}
        renderInputToolbar={renderCustomInputToolbar}
        renderAccessory={renderAccessory}
        messagesContainerStyle={styles.messagesContainer}
        renderMessage={renderMessageBox}
        renderCustomView={renderReplyMessageView}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    position: "relative",
    flexDirection: "column-reverse"
  },
  replyBarContainer: {
    height: "auto"
  },
  messagesContainer: {
    flex: 1
  },
  replyMessageContainer: {
    padding: 8,
    paddingBottom: 0
  },
  replyMessageDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "lightgrey",
    paddingTop: 6
  }
})

export default ChatScreen;