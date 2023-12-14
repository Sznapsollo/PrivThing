import React, {useEffect, useState} from 'react'
import {Alert, Snackbar} from '@mui/material'
import { AppState } from '../context/Context';
import { NotificationData } from '../model';
import { MAIN_ACTIONS } from '../context/Reducers';

let notifictionCloseHandle: ReturnType<typeof setTimeout> | null = null;

const NotificationComp = () => {

const { mainState, mainDispatch } = AppState();
const [show, setShow] = useState(false);

useEffect(() => {
    if(mainState.notificationData) {
        setShow(mainState.notificationData.show === true);
        if(notifictionCloseHandle != null) {
            clearTimeout(notifictionCloseHandle);
        }
        if(mainState.notificationData.closeAfter != null) {
            notifictionCloseHandle = setTimeout(() => {
                handleClose();
            }, mainState.notificationData.closeAfter)
        }
    }
}, [mainState.notificationData]);

const handleClose = () => {
    mainDispatch({type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: {show: false} as NotificationData})
};

return (
    <div style={{position: 'absolute', width: '100%', zIndex: 100}}>
        { 
            show && 
            <Snackbar open={true} onClose={handleClose}>
                <Alert onClose={handleClose} className='notificationText' variant="filled" severity={mainState.notificationData?.type || 'success'}>{mainState.notificationData?.message || ''}</Alert>
            </Snackbar>
        }
    </div>
)
}

export default NotificationComp
