import React, {useEffect} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppState } from './context/Context'
import Header from './components/HeaderComp'
import HomeComp from './components/HomeComp';

function App() {

    const { mainState, mainDispatch } = AppState();

    let timer: any;
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
                window.addEventListener(item, () => {
                resetTimer();
                handleLogoutTimer();
                });
            });
        } else {
            resetTimer();
        }
    }, [mainState.secret]);

    const handleLogoutTimer = () => {
        timer = setTimeout(() => {
          resetTimer();
          Object.values(events).forEach((item) => {
            window.removeEventListener(item, resetTimer);
          });
          forgetSecret();
        }, 10000); // 10s
    };

    const resetTimer = () => {
        if (timer) clearTimeout(timer);
    };
      
    const forgetSecret = () => {
        localStorage.clear();
        mainDispatch({type: 'CLEAR_SECRET'});
    };

    return (
        <div className="App">
            <BrowserRouter>
                <Header/>
                <Routes>
                <Route path='/' element={<HomeComp/>} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
