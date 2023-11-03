import React, {useEffect, useState} from 'react'
import {Alert} from '@mui/material'
import { AppState } from '../context/Context';
import { NotificationData } from '../model';

let notifictionCloseHandle: any = null;

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
    mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: false} as NotificationData})
};

return (
    <div style={{position: 'absolute', width: '100%', zIndex: 100}}>
        { show && <Alert onClose={handleClose} severity={mainState.notificationData?.type || 'success'}>{mainState.notificationData?.message || ''}</Alert> }
    </div>
)
}

export default NotificationComp
