import {useEffect, useState} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppState } from './context/Context'
import Header from './components/HeaderComp'
import HomeComp from './components/HomeComp';
import SettingsComp from './components/SettingsComp';
import moment from 'moment';

function App() {

    const { mainState, mainDispatch, settingsState } = AppState();
    const [headerCenterLabel, setHeaderCenterLabel] = useState<string>('')
    let forgetSecretTime: Date | undefined = undefined;

    let forgetTimer: any, forgetDebounceTimer: any, countDownTimer: any;
    const events = [
        "load",
        "mousemove",
        "mousedown",
        "click",
        "scroll",
        "keypress",
    ];

    useEffect(() => {
        if(mainState.secret) {
            Object.values(events).forEach((item) => {
                if(settingsState.forgetSecretMode === 'AFTER_TIME') {
                    window.removeEventListener(item, eventListenersPackage);
                    window.addEventListener(item, eventListenersPackage);
                } 
            });
        } else {
            resetTimer();
        }
    }, [mainState.secret]);

    const eventListenersPackage = () => {
        resetTimer();
        if(forgetDebounceTimer) {clearTimeout(forgetDebounceTimer);}
        forgetDebounceTimer = setTimeout(() => {
            handleLogoutTimer();
        }, 200); 
    }

    const handleLogoutTimer = () => {
        forgetSecretTime = new Date(new Date().getTime() + settingsState.forgetSecretTime);
        forgetTimer = setTimeout(() => {
          resetTimer();
          Object.values(events).forEach((item) => {
            window.removeEventListener(item, eventListenersPackage);
          });
          forgetSecret();
        }, settingsState.forgetSecretTime);
        countDownTimer = setInterval(() => {
            updateForgetSecretInfo();
        }, 1000)
    };

    const resetTimer = () => {
        if (forgetTimer) clearTimeout(forgetTimer);
        if (countDownTimer) clearInterval(countDownTimer);
        setHeaderCenterLabel('');
    };
      
    const forgetSecret = () => {
        localStorage.clear();
        mainDispatch({type: 'CLEAR_SECRET'});
    };

    const updateForgetSecretInfo = () => {
        if(!forgetSecretTime) {
            return
        }
        var timeDiff = forgetSecretTime.getTime() - new Date().getTime();
        let msg = 'Password will expire in ' + formatDate(new Date(timeDiff), "mm:ss")
        setHeaderCenterLabel(msg);
    }

    const formatDate = (value: Date | undefined, format: string): string => {
		if(!value) {
            return ''
        }
        try {
			return moment(value).format(format)
		} catch(e) {
			console.warn('format date')
		}
		return ''
	}

    return (
        <div className="App">
            <BrowserRouter basename='/listingFilesServer'>
                <Header centerLabel={headerCenterLabel}/>
                <Routes>
                <Route path='/' element={<HomeComp/>} />
                </Routes>
            </BrowserRouter>
            <SettingsComp show={mainState.showSettings}/>
        </div>
    );
}

export default App;
