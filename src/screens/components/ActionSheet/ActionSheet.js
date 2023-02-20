/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react';
import {
    Dimensions, SafeAreaView,
    StatusBar, StyleSheet,
    Text,

    TouchableOpacity, View
} from 'react-native';
import Modal from 'react-native-modal';
import ActionSheetModal from './ActionSheetModal';

const ActionSheet = ({ actionItems, open, setOpen }) => {
    const closeActionSheet = () => setOpen(false);
    return (
        <Modal
            isVisible={open}
            style={{
                margin: 0,
                justifyContent: 'flex-end'
            }}
        >
            <ActionSheetModal
                actionItems={actionItems}
                onCancel={closeActionSheet}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    buttonStyle: {
        height: 50,
        backgroundColor: 'rgb(0,98,255)',
        width: Dimensions.get('window').width - 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        margin: 10
    },
    buttonText: {
        fontSize: 17,
        color: 'rgb(255,255,255)',
    }
});

export default ActionSheet;