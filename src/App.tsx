import {useEffect} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import i18n from './i18n';
import AlertModalComp from './components/AlertModalComp';
import HeaderComp from './components/HeaderComp'
import HomeComp from './components/HomeComp';
import SettingsComp from './components/SettingsComp';
import NotificationComp from './components/NotificationComp';
import { retrieveLocalStorage } from './utils/utils';

function App() {

    useEffect(() => {
        let localLanguage = retrieveLocalStorage("privthing.userLanguage") || window.navigator.language;
        if(localLanguage) {
            i18n.changeLanguage(localLanguage);
        } else {
            i18n.changeLanguage('en');
        }
        
    }, []);
    

    return (
        <div className="App">
            <NotificationComp />
            <BrowserRouter basename='/listingFilesServer'>
                <HeaderComp />
                <Routes>
                    <Route path='/' element={<HomeComp/>} />
                </Routes>
            </BrowserRouter>
            <SettingsComp />
            <AlertModalComp />
        </div>
    );
}

export default App;
