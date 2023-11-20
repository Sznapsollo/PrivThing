import {useEffect} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import i18n from './i18n';
import AlertModalComp from './components/AlertModalComp';
import Header from './components/HeaderComp'
import HomeComp from './components/HomeComp';
import SettingsComp from './components/SettingsComp';
import NotificationComp from './components/NotificationComp';

function App() {

    console.log("App redraw")

    useEffect(() => {
        i18n.changeLanguage('en');
    }, []);

    return (
        <div className="App">
            <NotificationComp />
            <BrowserRouter basename='/listingFilesServer'>
                <Header />
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
