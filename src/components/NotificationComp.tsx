import React, {useEffect, useState} from 'react'
import {Alert} from 'react-bootstrap'
import { AppState } from '../context/Context';
import { NotificationData } from '../model';
import { MAIN_ACTIONS } from '../context/Reducers';

let notifictionCloseHandle: ReturnType<typeof setTimeout> | null = null;

const alertVariants: Record<string, string> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    error: 'danger'
}

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
            <div className='notificationContainer'>
                <Alert
                    className='notificationText'
                    variant={alertVariants[mainState.notificationData?.type || 'success']}
                    dismissible
                    onClose={handleClose}
                >{mainState.notificationData?.message || ''}</Alert>
            </div>
        }
    </div>
)
}

export default NotificationComp
