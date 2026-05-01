// 1. Убираем старый импорт 

import brain, { askJarvis, screenshotAnalysis } from "./brain";

let lastAnalysisResult = null; // Глобальная переменная для хранения результата анализа
let openedwindow = null;

const marks = async (logAndSay) => {
    // 1. Достаем данные из хранилища
    const storage = localStorage.getItem('jarvis_long_term_memory');
    
    if (!storage || storage === '[]') {
        logAndSay("Сэр, ваша долговременная память пуста. Планов не обнаружено.");
        return;
    }

    // 2. Формируем промпт, ВКЛЮЧАЯ туда данные из хранилища
    
    const prompt = `Вот содержимое моей памяти: ${storage}. Проанализируй эти данные и кратко опиши планы или важную информацию, которую я сохранил.`;

    try {
        // 3. Отправляем запрос 
        const res = await brain.askJarvis(prompt); 
        
        if (res && res.answer) {
            // 4. ОЗВУЧИВАЕМ результат
            await logAndSay(res.answer);
        }
    } catch (error) {
        console.error("Ошибка при чтении памяти:", error);
        logAndSay("Сэр, возникла ошибка при доступе к блокам памяти.");
    }
};

const fixedcopy = async (logAndSay) => {
    if (!lastAnalysisResult || !lastAnalysisResult.answer) {
        logAndSay("Сэр, сначала нужно проанализировать текст в буфере обмена.");
        return;
    }
    try {
        const response = await fetch('http://localhost:8000/clipboardfixed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: lastAnalysisResult.answer
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        logAndSay("Сэр, текст в буфере обмена был обновлен с учетом исправлений.");
    } catch (error) {
        console.error("Error in fixedcopy:", error);
        logAndSay("Сэр, ошибка при обновлении буфера обмена.");
    }
};

const getcopy = async (logAndSay) => {
    try {
        const response = await fetch('http://localhost:8000/clipboard', {});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.clipboard) {
            const prompt = `В буфере обмена находится текст: "${data.clipboard}". Исправь его и верни ТОЛЬКО ИСПРАВЛЕННЫЙ ТЕКСТ. Никаких объяснений, никаких дополнительных фраз, никаких статусов вроде "Анализ текста завершен". Если это код — верни только исправленный код, без markdown-обёрток и без пояснений НИКАКИХ СТАТУСОВ ТОЛЬКО СТРОГО ИСПРАВЛЕННЫЙ ТЕКСТ ИЛИ КОД.`;
            const res = await askJarvis(prompt);
            lastAnalysisResult = res; // Сохраняем результат
           
        } else {
            logAndSay("Сэр, буфер обмена пуст.");
        }
    } catch (error) {
        console.error("Error in getcopy:", error);
        logAndSay("Сэр, ошибка при получении текста из буфера обмена.");
    }
};
    let isVoiceActive = true;
  const Toglevoice = async (logAndSay, addLog) => {
    try {
        // Меняем локальное состояние на противоположное
        isVoiceActive = !isVoiceActive;

        // Отправляем новое состояние на сервер
        const response = await fetch(`http://localhost:8000/toggle_voice?status=${isVoiceActive}`);
        
        if (response.ok) {
            const data = await response.json();
            
            
            if (isVoiceActive) {
                logAndSay("Голосовые оповещения включены");
            } else {
                logAndSay("Система переведена в беззвучный режим");
            }
        }
    } catch (error) {
        console.error("Error in toggleVoice:", error);
        logAndSay("Сэр, ошибка связи с сервером.");
    }
}



const screenshot = async (logAndSay, addLog, setHistory) => {
     const response = await fetch('http://localhost:8000/screenshot', {
        headers: {
            'X-Jarvis-Token': 'my-ultra-secret-key-777'
        }
    });
    
    if (!response.ok) {
        addLog(`Ошибка получения скриншота: ${response.status} ${response.statusText}`);
        return;
    }
    
    const screen = await response.json();
    console.log("Screenshot response:", screen); // Логируем полный ответ в консоль
    
    if (screen && screen.screenshot) {
        const base64Image = `data:image/png;base64,${screen.screenshot}`; // Формируем правильный data URI для передачи в ИИ
        addLog(`Анализирую изображение с экрана`);
        const res = await screenshotAnalysis(base64Image); // Передаем base64 строку в функцию анализа
        if (logAndSay && res && res.answer) { // Проверяем, что res и res.answer существуют, прежде чем пытаться озвучить
            //добавляем исключение для ответа ии что бы он выдавал чистый текст без зведочек кавычек и слешей
            const cleanAnswer = res.answer.replace(/[\*\[\]\"]+/g, ''); // Убираем звездочки, квадратные скобки и двойные кавычки
             const screenshotMemory = { 
        role: "model", 
        parts: [{ text: JSON.stringify({ answer: `Вижу на экране: ${res.answer}` }) }] 
    };

    // 2. Добавляем в историю (имитируем ответ модели)
    setHistory(prev => [...prev, screenshotMemory].slice(-10));
            await logAndSay(cleanAnswer);
        }
    } else {
        addLog(`Скриншот не получен: ${JSON.stringify(screen)}`);
        console.error("Unexpected screenshot response:", screen);
    }
};


const chekmesages = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/get-notification');
    const data = await response.json();

    if (data && data.text) {
      // Формируем запрос для ИИ, чтобы он проанализировал сообщение
      const prompt = `Сэр, вам пришло сообщение от ${data.sender}: "${data.text}". Что ответите?`;
      
      brain.askJarvis(prompt).then((res) => {
        logAndSay(res.answer);
      });
    } else {
      logAndSay("Сэр, на текущий момент новых уведомлений не зафиксировано.");
    }
  } catch (err) {
    logAndSay("Сэр, возникла ошибка при попытке доступа к серверу уведомлений.");
  }
};

const openRandomMusic = () => {
    const links = [
        'https://www.youtube.com/watch?v=9vWNauaZAgg&list=PLR5Cmjo90BNguiSb2wDShPdKoa-Xiw5x1&index=3',
        'https://www.youtube.com/watch?v=1N8P0cmKNWc&list=RDGMEMQ1dJ7wXfLlqCjwV0xfSNbA'
    ];
    const randomLink = links[Math.floor(Math.random() * links.length)];
    window.open(randomLink, '_blank');
};

const openSpecificMusic = (param) => {
    if (!param) return;
    const query = (param.includes('youtube.com') || param.includes('youtu.be')) 
        ? param 
        : `${param} official audio`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
};

 export  const sendToExtension = (command, value = null) => {
    const extensionId = "lgcmhjigjnokoegngfecehngpeiebgmi";
    if (window.chrome && chrome.runtime) {
        chrome.runtime.sendMessage(extensionId, { command, value });
    }
};

const time = () => window.open('https://time100.ru/', '_blank');

// Исправленный поиск: передаем ответ ИИ прямо в функцию
function createDebouncedSearch() {
    let timer;
    return (query, answer, logAndSay, setAnim) => {
        // Проверяем: окно существует и оно НЕ закрыто
        if (openedwindow && !openedwindow.closed) {
            openedwindow.focus();
            // Можно еще обновить в нем запрос, если нужно:
            // openedwindow.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            if (logAndSay && answer) logAndSay("Переключаю на открытую вкладку, сэр");
        } else {
            clearTimeout(timer);
            if (setAnim) setAnim(true);

            timer = setTimeout(() => {
                // ВАЖНО: сохраняем ссылку на новое окно
                openedwindow = window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(query)}`, 
                    '_blank'
                );

                if (logAndSay && answer) {
                    logAndSay(answer);
                }
            }, 2000); 
        }
    };
}

const debouncedSearch = createDebouncedSearch();

// --- ГЛАВНАЯ ЛОГИКА ---
const logic = async (aiResponse, addLog, setAnim, logAndSay, controls,setHistory) => {


    if (aiResponse.command_id === "SECUNDOMER") {
        console.log("Controls check:", controls); // Для отладки
        if (!controls) return addLog("Ошибка: Модуль таймера не подключен");
    }
    if (!aiResponse) return;

    // 2. Логирование ошибок
    if (aiResponse.error && addLog) {
        addLog(`[ERROR]: ${aiResponse.error}`);
    }

    // 3. Выполнение команд
    if (!aiResponse.command_id) {
        if (aiResponse.answer) {
            logAndSay(aiResponse.answer);
        }
        return;
    }

    // Гарантируем, что работаем с массивом
    const commands = Array.isArray(aiResponse.command_id) 
        ? aiResponse.command_id 
        : [aiResponse.command_id];

    const hasSystemStats = commands.includes("GET_SYSTEM_STATS");

    // Если команда включает только статистику, не озвучиваем первичный ответ ИИ до получения цифр
    if (aiResponse.answer && !hasSystemStats) {
        logAndSay(aiResponse.answer);
    }

// Используем for...of вместо forEach, так как внутри есть await (fetch, logAndSay)
for (const id of commands) {
    switch (id) {
        case "OPEN_MUSIC":
            if (aiResponse.params && aiResponse.params !== "null") {
                openSpecificMusic(aiResponse.params);
            } else {
                openRandomMusic();
            }
            break;

        case "OPEN_MUSICNOTRANDOME":
            openSpecificMusic(aiResponse.params);
            break;

        case "SEARCH":
            debouncedSearch(aiResponse.params, aiResponse.answer, logAndSay, setAnim);
            break;
        case "CHEKSCREEN":
            screenshot(logAndSay, addLog,setHistory);
            break;
           case "OPEN_APP":
    if (aiResponse.params) {
        addLog(`Launching: ${aiResponse.params}...`);
        
        // 1. Сначала идет URL (строка)
        // 2. Потом через запятую объект { headers: ... }
        fetch(`http://localhost:8000/open?name=${encodeURIComponent(aiResponse.params)}`, {
            headers: {
                'X-Jarvis-Token': 'my-ultra-secret-key-777'
            }
        }) 
        .then(response => response.json())
        .then(data => console.log(`App launch response:`, data))
        .catch(error => console.error(`Error launching app:`, error));
    } 
    break;
        case "CLOSE_APP":
            if (aiResponse.params){
                addLog(`Closing: ${aiResponse.params}...`);
                // Отправляем запрос на наш FastAPI
                fetch(`http://localhost:8000/close?name=${encodeURIComponent(aiResponse.params)}`, {
                    headers: {
                        'X-Jarvis-Token': 'my-ultra-secret-key-777'
                    }
                }) // FastAPI обрабатывает этот запрос и закрывает нужное приложение
                    .then(response => response.json())
                    .then(data => console.log(`App close response:`, data))
                    .catch(error => console.error(`Error closing app:`, error));
            }
            break;

        case "FIXEDVOLUME":
            sendToExtension("set_volume", aiResponse.params);
            break;
        case "VOLUME_UP":
            sendToExtension("volume_up");
            break;
        case "VOLUME_DOWN":
            sendToExtension("volume_down");
            break;
        case "TIME":
            time();
            break;
        case "MUTE_ALL":
            Toglevoice();
            break;
        case "PAUSE":
        case "STOP":
            sendToExtension("stop_track");
            break;

        case "NEXT":
            sendToExtension("next_track");
            break;
        
        case"MARKS":
            marks(logAndSay);
        break;


         case "START_TIMER":
    if (controls) {
        controls.setIsActive(true);
        addLog("[SYSTEM]: Хронометр запущен.");
    }
    break;

case "STOP_TIMER":
    if (controls) {
        controls.setIsActive(false);
        addLog("[SYSTEM]: Хронометр остановлен.");
    }
    break;

case "RESET_TIMER":
    if (controls) {
        controls.setIsActive(false);
        controls.setSeconds(0);
        addLog("[SYSTEM]: Данные хронометра сброшены.");
    }
    break;

          

        case "PREVIOUS":
            sendToExtension("before_track");
            break;
            
        case"chekmesages":
            chekmesages();
            break;



        case "GET_SYSTEM_STATS":
            const response = await fetch('http://localhost:8000/stats');
            const stats = await response.json();
            const report = `CPU: ${stats.cpu}, RAM: ${stats.ram}, CPU temp: ${stats.cpu_temp}, GPU temp: ${stats.gpu_temp}.`;
            if (logAndSay) {
                await logAndSay(report);
            }
            // Возвращаем данные, чтобы Sphere.jsx мог обновить интерфейс
            return { type: 'system_stats', data: { cpu: stats.cpu, ram: stats.ram, cpu_temp: stats.cpu_temp, gpu_temp: stats.gpu_temp, network: stats.network }, answer: report };


        case "STOPFUNCTION":
            const stopMsg = "Протокол прерывания активирован. Выполнение остановлено.";
            addLog("[SYSTEM]: EMERGENCY STOP");
            await logAndSay(stopMsg); 
            return; // Прерывает выполнение всей функции



        case "LOOKAFTERSOMETHING":
            // Эта команда  для анализа текста или кода из буфера обмена
            getcopy();
            break;
        case "FIXAFTERSOMETHING":
            // Эта команда для исправления или оптимизации текста или кода из буфера обмена после анализа
            fixedcopy(logAndSay); // Передаем logAndSay, чтобы после исправления ИИ мог озвучить результат
            break;
        default:
            console.log("Unknown command:", id);
    }
}}


export default logic;

