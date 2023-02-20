import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react"
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, ActionSheetIOS, TouchableOpacity, Dimensions } from "react-native"
import { GiftedChat, InputToolbar, Bubble, MessageImage } from "react-native-gifted-chat"
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import ChatMessageBox from "./components/ChatMessageBox"
import ReplyMessageBar from "./components/ReplyMessageBar"
import { collection, orderBy, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import uuid from 'react-native-uuid';
import { ref, getDownloadURL, uploadBytesResumable, getStorage } from "firebase/storage";
import Video from 'react-native-video';
import ActionSheet from "./components/ActionSheet/ActionSheet";

import DocumentPicker, {
  DirectoryPickerResponse,
  DocumentPickerResponse,
  isInProgress,
  types,
} from 'react-native-document-picker'
import FileViewer from "react-native-file-viewer";
const ChatScreen = ({ route, navigation }) => {
  const [replyMessage, setReplyMessage] = useState(null);
  //using ref for swiping a message because user can only 
  //swipe one message at a time.
  const swipeableRowRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true);
  var conversation = route.params.conversation.conversation;
  const [messages, setMessages] = useState([])
  const clearReplyMessage = () => setReplyMessage(null);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);

  const attachmentOptions = [
    {
      id: 1,
      label: 'Camera',
      onPress: () => {
        launchCamera().then((res) => {
          setOpenAttachmentModal(false)
          if (!res.didCancel && !res.errorCode) {
            uploadMediaToFirestore(res, 'image');
          }
        });
      }
    },
    {
      id: 2,
      label: 'Image',
      onPress: () => {
        // setOpenAttachmentModal(false)
        launchImageLibrary().then((res) => {
          setOpenAttachmentModal(false)
          if (!res.didCancel && !res.errorCode) {
            uploadMediaToFirestore(res, 'image');
          }
        });
      }
    },
    {
      id: 3,
      label: 'Video',
      onPress: () => {
        const options = {
          title: 'Video Picker',
          mediaType: 'video',
        };
        launchImageLibrary(options).then((res) => {
          setOpenAttachmentModal(false)
          if (!res.didCancel && !res.errorCode) {
            uploadMediaToFirestore(res, 'video');
          }
        });
      }
    },
    {
      id: 4,
      label: 'Document',
      onPress: () => {
        DocumentPicker.pickSingle({
          presentationStyle: 'fullScreen',
          copyTo: 'cachesDirectory',
        })
          .then((res) => uploadMediaToFirestore(res, 'doc'))
          .catch((err) => console.log(err))
      }
    },
  ];
  useLayoutEffect(() => {
    setIsLoading(true)
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={gotoMedia}>
          <Text>Media</Text>
        </TouchableOpacity>
      )
    })
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
        image: doc.data().image,
        video: doc.data().video,
        file: doc.data().file,
      }))
    ));
    setIsLoading(false);
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, []);


  const gotoMedia = () => {
    setOpenAttachmentModal(true)
    // ActionSheetIOS.showActionSheetWithOptions({
    //   options: ["Cancel", "Camera", "Photos", "Video"],
    //   cancelButtonIndex: 0
    // },
    //   buttonIndex => {
    //     if (buttonIndex == 2) {
    //       launchImageLibrary().then((res) => {
    //         if (!res.didCancel && !res.errorCode) {
    //           uploadMediaToFirestore(res, 'image');
    //         }
    //       });
    //     } else if (buttonIndex == 1) {
    //       launchCamera().then((res) => {
    //         if (!res.didCancel && !res.errorCode) {
    //           uploadMediaToFirestore(res, 'image');
    //         }
    //       });
    //     } else if (buttonIndex == 3) {
    //       const options = {
    //         title: 'Video Picker',
    //         mediaType: 'video',
    //       };
    //       launchImageLibrary(options).then((res) => {
    //         if (!res.didCancel && !res.errorCode) {
    //           uploadMediaToFirestore(res, 'video');
    //         }
    //       });
    //     }
    //   })
  }

  async function uploadMediaToFirestore(res, type) {
    const uri = type === 'doc' ? res.uri : res.assets[0].uri;
    const filename = type === 'doc' ? res.name : res.assets[0].fileName;
    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const storageRef = ref(getStorage(), filename);

    const img = await fetch(uploadUri);
    const blob = await img.blob();

    console.log("uploading image");
    const uploadTask = uploadBytesResumable(storageRef, blob);


    uploadTask.on('state_changed', (snapshot) => {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case 'paused':
          console.log('Upload is paused');
          break;
        case 'running':
          console.log('Upload is running');
          break;
      }
    },
      (error) => {
        // this.setState({ isLoading: false })
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case 'storage/unauthorized':
            console.log("User doesn't have permission to access the object");
            break;
          case 'storage/canceled':
            console.log("User canceled the upload");
            break;
          case 'storage/unknown':
            console.log("Unknown error occurred, inspect error.serverResponse");
            break;
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
          if (type == 'video') {
            setVideoData(downloadURL);
          } else if (type == 'image') {
            setImageData(downloadURL);
          }
          else if (type == "doc") {
            setFileData(downloadURL, filename, filename.split('.').pop(), uri);
          }
        });
      });
  }

  const setImageData = (url) => {
    const imageMessage = [
      {
        _id: uuid.v4(),
        createdAt: new Date(),
        image: url,
        user: {
          _id: auth?.currentUser?.uid,
          avatar: auth?.currentUser?.photoURL
        },
      },
    ];
    setMessages(previousMessages => GiftedChat.append(previousMessages, imageMessage))
    const { _id, createdAt, user, image } = imageMessage[0]
    setDoc(doc(db, 'message', conversation.id, "messages", _id), { id: _id, sent_at: createdAt, image, sent_by: user, replyMessage: null });
  }

  const setVideoData = (url) => {
    const imageMessage = [
      {
        _id: uuid.v4(),
        createdAt: new Date(),
        video: url,
        user: {
          _id: auth?.currentUser?.uid,
          avatar: auth?.currentUser?.photoURL
        },
      },
    ];
    setMessages(previousMessages => GiftedChat.append(previousMessages, imageMessage))
    const { _id, createdAt, user, video } = imageMessage[0]
    setDoc(doc(db, 'message', conversation.id, "messages", _id), { id: _id, sent_at: createdAt, video, sent_by: user, replyMessage: null });
  }


  const setFileData = (url, filename, type, local_uri) => {
    const imageMessage = [
      {
        _id: uuid.v4(),
        createdAt: new Date(),
        file: { url, filename, type, local_uri },
        user: {
          _id: auth?.currentUser?.uid,
          avatar: auth?.currentUser?.photoURL
        },
      },
    ];
    setMessages(previousMessages => GiftedChat.append(previousMessages, imageMessage))
    const { _id, createdAt, user, file } = imageMessage[0]
    setDoc(doc(db, 'message', conversation.id, "messages", _id), { id: _id, sent_at: createdAt, file, sent_by: user, replyMessage: null });
  }


  const renderMessageVideo = (props) => {
    const { currentMessage } = props;
    console.log(currentMessage.video);
    return (

      <View style={{ position: 'relative', height: 150, width: 250 }}>

        <Video
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 150,
            width: 250,
            borderRadius: 20,
          }}
          shouldPlay

          rate={1.0}
          resizeMode="cover"
          height={150}
          width={250}
          muted={false}
          source={{ uri: "https://firebasestorage.googleapis.com/v0/b/coupon-2379f.appspot.com/o/small.mp4?alt=media&token=4f4722e3-c9fc-49a8-a753-1d635e99eb43" }}
          allowsExternalPlayback={false}></Video>

      </View>
    );
  };

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

  const openDocument = (file) => {
    FileViewer.open(file.local_uri).catch((err) => { alert("Could not open the file!") })
  }
  const renderReplyMessageView = (props) => {
    return (
      //Bubble design if reply message exists
      props.currentMessage.file === undefined ? (props.currentMessage &&
        props.currentMessage.replyMessage && (
          <View style={styles.replyOuterContainer}>
            <View style={styles.replyMessageContainer}>
              <Text style={styles.replyText}>{props.currentMessage.replyMessage.text}</Text>
            </View>
          </View>)) :
        <TouchableOpacity style={{ marginHorizontal: 16, marginVertical: 16 }} onPress={() => openDocument(props.currentMessage.file)}>
          <Text style={{ color: "#F8F4EA" }}>{props.currentMessage?.file?.filename}</Text>
        </TouchableOpacity>
    )
  }

  const renderBubble = (props) =>
    <Bubble
      {...props}
      textStyle={{
        right: {
          color: '#F8F4EA',
        },
      }}
      wrapperStyle={{
        right: {
          backgroundColor: '#393E46',
        },
        left: {
          backgroundColor: '#fff',
        },
      }}
    />

  const renderMessageImage = (props) =>
    <MessageImage
      imageStyle={{
        width: 200,
        height: 180,
        resizeMode: 'cover'
      }}
      {...props}
    />


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ActionSheet actionItems={attachmentOptions} open={openAttachmentModal} setOpen={setOpenAttachmentModal} />
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
        renderBubble={renderBubble}
        renderMessageImage={renderMessageImage}
        renderMessageVideo={renderMessageVideo}
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
    flexDirection: "row",
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: "#8c95a9",
  },
  replyOuterContainer: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  replyText: {
    color: "#1d2020",
    padding: 8
  }
})

export default ChatScreen;