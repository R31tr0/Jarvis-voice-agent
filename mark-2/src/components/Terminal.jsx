import React, { useState, useEffect, useRef } from 'react';
import logic from '../logic/commands';
import { useLogs } from "../hooks/useLogs";
import useSpeech from '../hooks/useSpeachToText';
import JarvisModal from './Modal';
import '../styles/terminal.css';
const INITIAL_MESSAGES = [
  'Welcome to the J.A.R.V.I.S. Terminal.',
  'Type "help" for a list of commands.'
];

const Terminal = ({ setStats }) => {
 // 1. Состояние для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogsMode, setIsLogsMode] = useState(false);
  const {logs} = useLogs();
  const [history, setHistory] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isGaming, setIsGaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const recognitionRef = useRef(null);

useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
    }
}, []);
  useEffect(() => {
    const autogamechek = async () => {
        try {
            const response = await fetch('http://localhost:8000/stats');
           const data = await response.json(); // Теперь это data

        // Обновляем локальные индикаторы терминала
        setIsGaming(data.time_played_min > 0);
        setHasNewMessage(data.has_new_tg_msg === true);

            if (setStats) {
          setStats(prev => ({
            ...prev,
            // Мапим данные из бэкенда на ключи твоего стейта в Сфере
            cpu: parseFloat(data.cpu) || 0,
            ram: parseFloat(data.ram) || 0, 
            cpu_temp: parseFloat(data.cpu_temp) || 0,
            gpu_temp: parseFloat(data.gpu_temp) || 0,
            network: data.network || prev.network
          }));
        }
        } catch (err) {
            console.error("Джарвис: ошибка связи со статами", err);
        }
    };

    // Запускаем проверку каждые 2 секунды
    const interval = setInterval(autogamechek, 20000);
    autogamechek();
    return () => clearInterval(interval); 
}, [setStats]); 
        

  
  // Автофокус и автоскролл
  useEffect(() => {
    inputRef.current?.focus();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

   const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const command = input.trim().toLowerCase();
      
      // 1. Сначала обрабатываем команды, которые полностью меняют историю (clear, help)
      if (command === 'clear') {
        setHistory(INITIAL_MESSAGES);
        setInput('');
        return;
      }
      if (command === 'tg') {
    // Если была открыта — закроется, если закрыта — откроется
    setIsModalOpen(prev => !prev); 
    
    setHistory(prev => [...prev, `$ ${input}`]);
    setInput('');
    return;
}
              
      if (command === 'help') {
        setHistory(prev => [...prev, `$ ${input}`, 
          'Available commands:', 
          'help - список команд',
          'jarvis - тригерная фраза',
          'clear - очистить терминал',
          'time / jarvis time - показать время',
          'logs - показать логи',
          'stop - остановить поток логов',
          'TG - авторизация в тг что бы джарвис слушал сообщения и мог отвечать на них',
          'фразы :',
          `джарвис открой (имя приложения) - открывает приложение`,
          `джарвис закрой (имя приложения) - закрывает приложение`,
          `джарвис (имя приложения) статус - показывает статус приложения`,
          `джарвис (имя приложения) запусти (действие) - выполняет действие с приложением`,
          `джарвис включи музыку - включает музыку`,
          `джарвис выключи музыку - выключает музыку`,
          `джарвис громчке - увеличивает громкость`,
          `джарвис тише - уменьшает громкость`,
          `джарвис громкость (значение) - устанавливает громкость на определенное значение`,
          `джарвис разверни на весь экран - разворачивает приложение на весь экран`,
          `джарвис сверни - сворачивает приложение`,
          `джарвис перезагрузи - перезагружает приложение`,
          `джарвис статистика системы - показывает статистику системы`,
          `джарвис интернет статус - показывает статус интернет-соединения`,
          `джарвис найди (запрос) - выполняет поиск в интернете`,
          `джарвис  кто мне написал - показывает, кто отправил последнее сообщение в чате`,
          `джарвис анализируй текст - анализирует скопированный текст и выдает результат`,
          `джарвис верни мне исправленный текст - исправляет грамматические ошибки в скопированном тексте и возвращает результат в буффер обмена`,
          `джарвис  анализируй и переведи (текст) на (язык) - переводит текст на указанный язык и возвращает результат в буффер обмена`,
          `джарвис может попомгать с кодом таким способом`,
          `джарвис  найди ошибку в коде - анализирует скопированный код и возвращает найденные ошибки и рекомендации по их исправлению`,
          `джарвис стоп - останавливает все текущие процессы и возвращает систему в исходное состояние`,
          `джарвис анализируй экран - анализирует текущий экран и выдает описание увиденного`,
          `так же с джарвисом можно общаться на любые темы, он будет поддерживать диалог и отвечать на вопросы в рамках своих возможностей.`,
          `джарвис обладает памятью текущего диалога  и настоящей памятью длинной в 6 последних запросов`,
          `джарвис может выполнять команды по расписанию, например: "джарвис напомни мне через 10 минут проверить почту" ВАЖНО только если будет включен таймер.`,
          `джарвис может работать с несколькими приложениями одновременно, например: "джарвис открой браузер и блокнот" и затем управлять ими по отдельности.`,
          `джарвис может засекать время по ключевой фразе таймер`,
          `джарвис может запоминать события которые вы емму скажете навсегда например джарвис запомни на сегодня`,
          `джарвис умеет очищать свою память по ключевой фразе очисти память джарвис`,
          `ВАЖНО ЭТО ВЕРСИЯ МАРК 3 ОНА ЭКСПЕРИМЕНТАЛЬНА И НЕ СТАБИЛЬНА, ОНА МОЖЕТ НЕ ВЫПОЛНЯТЬ НЕКОТОРЫЕ КОМАНДЫ ТЕРЯТЬ МИКРОФОН И БОЛЕЕ СКОВАНА В ПЛАНЕ ДЕЙСТВИЙ И БАГОВ .`
          
        ]);
        setInput('');
        return;
      }

      // 2. Для остальных команд определяем текст ответа
      let response = `Unknown command: ${command}`;

      if (command === 'джарвис') {
        response = 'Реактор активирован. Мощность 100%.';
      } 
      // ИСПРАВЛЕННОЕ УСЛОВИЕ:
      else if (command === 'время' || command === 'джарвис время') {
        const now = new Date();
        response = `Текущее время: ${now.toLocaleTimeString()}`;
      } 
        else if (command === 'logs') {
        setIsLogsMode(true);
        const initialLogs = logs.length > 0 ? logs.join(' | ') : "Logs are empty";
        const startMsg = `[STREAM STARTED]: ${initialLogs}`;
  
  // ПРАВИЛЬНО: Берем старый массив и добавляем в него новые элементы
  setHistory(prev => [...prev, `$ ${input}`, startMsg]);

  window.jarvisStream = (newLog) => {
    // ПРАВИЛЬНО: Добавляем лог как новый элемент массива
    setHistory(prev => [...prev, `> ${newLog}`]);
  };

  setInput('');
  return; 
} else if (command ==='stop'){
  
  setIsLogsMode(false)
  window.jarvisStream = null; // Закрываем поток
        setHistory(INITIAL_MESSAGES);
        setInput('');
        return;
}
// else if (command ==='mute'){
//       recognition.onend = null; // Отключаем автоперезапуск перед остановкой
//       recognition.stop();
//       return;
// }


      // 3. Добавляем результат в историю
      setHistory(prev => [...prev, `$ ${input}`, response]);
      setInput(''); 
    }
  };

  return (
    
    <div className="terminal-container">
    <div className="status-bar" style={{ display: 'flex', gap: '20px', padding: '10px',  }}>
  
  {/* Индикатор Телеграма */}
  <div style={{ 
    color: hasNewMessage ? '#00dfff' : '#333', 
    animation: hasNewMessage ? 'blink 1s infinite' : 'none',
    textShadow: hasNewMessage ? '0 0 10px #00dfff' : 'none'
  }}>
    ● TG
  </div>

  {/* Индикатор Игры */}
  <div style={{ color: isGaming ? '#ff4444' : '#333' }}>
    ● GAME: {isGaming ? 'ACTIVE' : 'Active'}
  </div>

  {/* Индикатор Микрофона (Слушает ли телефон/пк сейчас) */}
  <div style={{ 
    color: isListening ? '#00ff00' : '#333',
    boxShadow: isListening ? 'inset 0 0 5px #00ff00' : 'none'
  }}>
    ● MIC
  </div>

</div>
      <div className="terminal-output">
        {history.map((line, index) => (
          <div key={index} className="terminal-line">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <JarvisModal 
        openModal={isModalOpen} 
        closeModal={closeModal} 
      />
      <div className="terminal-input-area">
        <span className="prompt">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} // Важно: вызываем функцию здесь
          className="terminal-input"
        />
      </div>
    </div>
  );
};
export default Terminal;