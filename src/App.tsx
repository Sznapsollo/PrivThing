import {useEffect} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import i18n from './i18n';
import AlertModalComp from './components/AlertModalComp';
import ErrorBoundaryComp from './components/ErrorBoundaryComp';
import HeaderComp from './components/HeaderComp'
import HomeComp from './components/HomeComp';
import SettingsComp from './components/SettingsComp';
import NotificationComp from './components/NotificationComp';
import { retrieveLocalStorage } from './utils/utils';
import { AppState } from './context/Context';
import { applyAppTheme, isSystemAppTheme, watchSystemTheme } from './utils/appTheme';

function App() {

    const { settingsState: { appTheme } } = AppState();

    useEffect(() => {
        applyAppTheme(appTheme);
        if (!isSystemAppTheme(appTheme)) {
            return
        }
        return watchSystemTheme(() => applyAppTheme(appTheme))
    }, [appTheme]);

    useEffect(() => {
        let localLanguage = retrieveLocalStorage("privthing.userLanguage") || window.navigator.language;
        if(localLanguage) {
            i18n.changeLanguage(localLanguage);
        } else {
            i18n.changeLanguage('en');
        }
        
    }, []);
    
    // in package
    // "proxy": "http://localhost:8190/listingFilesServer",
    // "homepage": "/listingFilesServer",

    // <BrowserRouter basename='/listingFilesServer'>

    return (
        <div className="App">
            <NotificationComp />
            <ErrorBoundaryComp>
                <BrowserRouter>
                    <HeaderComp />
                    <Routes>
                        <Route path='/' element={<HomeComp/>} />
                    </Routes>
                </BrowserRouter>
            </ErrorBoundaryComp>
            <SettingsComp />
            <AlertModalComp />
        </div>
    );
}

export default App;
