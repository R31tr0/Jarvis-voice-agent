import React, { useState,useEffect } from 'react';
import Sphere from './components/Sphere.jsx';
import { LogProvider } from './hooks/useLogs.jsx';
import logic from './logic/commands.js';
import brain, { askJarvis, screenshotAnalysis } from "./logic/brain.js";
function App() {
  const [isActivated, setIsActivated] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);



  const timerControls = {
    isActive,
    setIsActive,
    setSeconds,
    seconds
  };
  // ОТДЕЛЬНАЯ ПЕРЕМЕННАЯ СПИК ДЛЯ ПРИВЕТСВИЯ 
  // --- ЛОГИКА ГОЛОСА ---
  const speak = async (message) => {
    try {
      // Отправляем текст на ваш Python-сервер (порт 8000)
      const response = await fetch(`http://localhost:8000/say?text=${encodeURIComponent(message)}`);
      
      if (response.ok) {
        // Проигрываем файл, добавляя timestamp для обхода кэша
        const audio = new Audio(`http://localhost:8000/listen?t=${Date.now()}`);
        await audio.play();
      }
    } catch (error) {
      console.error("Голосовой модуль недоступен:", error);
    }
  };
//таймер
useEffect(() => {
    let interval = null;

    if (isActive) {
        // Вместо while используем эффект, который реагирует на флаг isActive
        interval = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    } else {
        clearInterval(interval);
    }

    return () => clearInterval(interval); 
}, [isActive]); // Эффект сработает только при изменении флага
const handleAiAction = (aiResponse) => {
    // Передаем функцию setIsActive внутрь логики
    logic(aiResponse, addLog, setAnim, logAndSay, { setIsActive });
  };

  
  // Функция для кнопки
  const handleActivation = async (logAndSay) => {
    setIsActivated(true);
    // Джарвис говорит фразу при активации
     const storage = localStorage.getItem('jarvis_long_term_memory');
    const prompt = `Вот содержимое моей памяти: ${storage},поздаровайся с пользователем скажи что все системы в норме и если есть какие то планы в памяти озвучь их так же если в мире произошло что то новое из фронтенд разработки или игр обязательно оповести пользователя `
    try{
      const res = await brain.askJarvis(prompt);
      if(res&& res.answer){
         await speak(res.answer);
      }
    }
    catch(err){
       console.error("Ошибка при инициализации:", err);
        speak("Сэр, возникла ошибка при инициализации.");
    }
  };

  return (
    <LogProvider> 
      <div className="app-wrapper" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
        {!isActivated ? (
          <div className="activation-screen">
            <button 
              className="activate-btn"
              onClick={handleActivation} // Вызываем нашу новую функцию
            >
              INITIALIZE SYSTEMS
            </button>
          </div>
        ) : (
          <div className="jarvis-interface">
            <Sphere  timerControls={timerControls}/> 
          </div>
        )}
      </div>
    </LogProvider>
  );
}

export default App;