import React from "react"
import { View, Image, StyleSheet, Animated } from "react-native"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"
import { Message } from "react-native-gifted-chat"
import { isSameDay, isSameUser } from "react-native-gifted-chat/lib/utils"

const ChatMessageBox = ({ setReplyOnSwipeOpen, updateRowRef, ...props }) => {
  const isNextMyMessage =
    props.currentMessage &&
    props.nextMessage &&
    isSameUser(props.currentMessage, props.nextMessage) &&
    isSameDay(props.currentMessage, props.nextMessage)


  //Animating the Bubble and reply icon view on swipe
  const renderRightAction = progressAnimatedValue => {
    const size = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 100],
      outputRange: [0, 1, 1]
    })
    const trans = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, -12, -20]
    })

    return (
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: size }, { translateX: trans }] },
          isNextMyMessage
            ? styles.defaultBottomOffset
            : styles.bottomOffsetNext,
          props.position === "right" && styles.leftOffsetValue
        ]}
      >
        <View style={styles.replyImageWrapper}>
          <Image
            style={styles.replyImage}
            source={require("../../../assets/reply.png")}
          />
        </View>
      </Animated.View>
    )
  }

  const onSwipeOpenAction = () => {
    //setting the current message as replyMessage if the swipe is done
    //to render Accessory (reply bar above the message input field)
    if (props.currentMessage) {
      setReplyOnSwipeOpen({ ...props.currentMessage })
    }
  }

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={updateRowRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={renderRightAction}
        onSwipeableOpen={onSwipeOpenAction}
      >
        <Message {...props} />
      </Swipeable>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 40
  },
  replyImageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  replyImage: {
    width: 20,
    height: 20
  },
  defaultBottomOffset: {
    marginBottom: 2
  },
  bottomOffsetNext: {
    marginBottom: 10
  },
  leftOffsetValue: {
    marginLeft: 16
  }
})

export default ChatMessageBox
