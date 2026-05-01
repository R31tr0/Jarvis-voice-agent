import React, { useEffect, useState, useCallback, useRef, use } from "react";
import '../styles/sphere.css';
import Terminal from "./Terminal";
import useSpeech from "../hooks/useSpeachToText";
import logic from "../logic/commands";
import {sendToExtension} from'../logic/commands.js'
import brain from "../logic/brain";
import controller from "../logic/mistakes";
import ProgressNetwork from "./progresbarNetwork";
import ProgressBars from "./progresbars";
const Sphere = ( { timerControls }) => {
    
    const [anim, setAnim] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [history, setHistory] = useState([]);
    const [ispause, setpause] = useState(false);
    const [stats, setStats] = useState({ cpu_usage: 0, gpu_usage: 0, cpu_temp: 0, gpu_temp: 0, network: { upload_mbps: 0, download_mbps: 0,top_process_mbps: 0 } });
    const [allhistory, setallhistory] = useState(() => {
        const saved = localStorage.getItem('jarvis_long_term_memory');
        return saved ? JSON.parse(saved) : [];
    });

    //контролер сообщений  фоновый
    //если проект вырастет и будет использоватся на гит
    //обязательно настроить свою сессию телеграма на беке делается в 3 клика
    //исправленно теперь есть модальное окно в консоли tg

useEffect(() => {
  const checkNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/get-notification');
      const data = await response.json();
      if (data && data.text) {
      const promt =`проанализируй содержимое сообщения ${data.text} и скажи кратко что там написано и от кого оно пришло. Если там есть ссылка, замени её словом "ссылка",если там например строчки из песни так и скажи что это строчки из песни. Ответ дай в виде короткой фразы которая описывпет содержимое сообщения для озвучки о чем сообщение.`
    const aiResponse = await brain.askJarvis(promt);
      const fixedText = aiResponse.answer;
      if(fixedText){
        logAndSay(`Сэр, пришло сообщение от ${data.sender}: ${fixedText}`);
      }
    }
    } catch (err) {
      console.error("Ошибка связи с бэкендом:", err);
    }
  };

  const interval = setInterval(checkNotifications, 60000); // Сделал интервал в 60 секунд, чтобы не перегружать сервер запросами
  return () => clearInterval(interval);
}, [setHistory]);
  




    // БЛОКИРОВЩИК БАГА: useRef всегда хранит актуальное значение вне зависимости от рендера
    const isProcessing = useRef(false);

    // --- ФУНКЦИЯ ОЗВУЧКИ2 зависит от ответа на сервере
    const logAndSay = useCallback(async (msg) => {
        if (!msg) return;
        try {
            // const response = await fetch(`http://localhost:8000/say?text=${encodeURIComponent(msg)}`);
            const response = await fetch(`http://localhost:8000/say?text=${encodeURIComponent(msg)}`);
            if (response.ok) {
                 sendToExtension("volume_down");
                const audio = new Audio(`http://localhost:8000/listen?t=${Date.now()}`);
                audio.volume = 0.4;
                 audio.onended = () => {
                    sendToExtension("volume_up"); 
                };
                await audio.play();                
            }
        } catch (error) {
            console.error("Голосовой сервер не отвечает:", error);
        }
        if (msg.includes("остановил вызов")) {
            throw new Error(msg);
        }
    }, []);

    // --- ФОНОВАЯ ЖИЗНЕДЕЯТЕЛЬНОСТЬ (Anti-Sleep & Visibility) ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            const hidden = document.hidden;
            if (hidden) {
                console.log("[SYSTEM] Вкладка в фоне. Мониторинг активен.");
                setAnim(false); 
            }
        };

        const keepAlive = () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') audioContext.resume();
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; 
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            console.log("[SYSTEM] Аудио-якорь запущен.");
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('click', keepAlive, { once: true });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('click', keepAlive);
        };
    }, []);

    // Синхронизация памяти
    useEffect(() => {
        localStorage.setItem('jarvis_long_term_memory', JSON.stringify(allhistory));
    }, [allhistory]);


    
    // --- ФОНОВЫЙ МОНИТОРИНГ ЖЕЛЕЗА ---
    useEffect(() => {
        const autosystemchek = async () => {
            

            try {
                // const response = await fetch('http://localhost:8000/stats');
                const response = await fetch('http://localhost:8000/stats');
                const stats = await response.json();
                const clearstats = Object.fromEntries(
                Object.entries(stats).map(([key, value]) => [
                key, 
                key === 'network' ? value : parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
        ])
);
                setStats(clearstats);
                const isHot = parseInt(clearstats.cpu_temp) > 80 || parseInt(clearstats.gpu_temp) > 100;

                if (isHot) {
                    const report = `КРИТИЧЕСКИЙ НАГРЕВ: CPU ${clearstats.cpu_temp}°, GPU ${clearstats.gpu_temp}°.`;
                    const coment = await brain.askJarvis(report, history);
                    if (coment?.answer) {
                        logAndSay(coment.answer);
                        setAnim(true);
                        setTimeout(() => setAnim(false), 4000);
                    }
                }
            } catch (e) { console.error("Ошибка мониторинга:", e); }
        };
        const intervalid = setInterval(autosystemchek, 300000); // Каждые 5 минут
        return () => clearInterval(intervalid);
    }, [history, logAndSay]);

    // --- ГЛАВНЫЙ ОБРАБОТЧИК КОМАНД (FIXED) ---
    const handleCommand = useCallback(async (rawTranscript, addLog) => {
        if (isProcessing.current) return;

        const clean = controller(rawTranscript).toLowerCase();
        if (!clean.includes('джарвис')) return;

        try {
            isProcessing.current = true;
            setAnim(true);
            setCurrentTranscript(clean);
            addLog(`Analyzing request...`);

            let finalPrompt = clean;
            let isSystemQuery = false;



            //озвучка таймера
           if (clean.includes("сколько секунд") || clean.includes("время на таймере")) {
            const currentSeconds = timerControls.seconds;
            addLog(`Запрос времени: ${currentSeconds}s`);

                // Формируем системный промпт, чтобы Джарвис ответил красиво
    const timerPrompt = `Системное сообщение: На секундомере сейчас ${currentSeconds} сек. 
                         Пользователь спросил: "${clean}". 
                         Ответь как Джарвис, сколько времени прошло.`;

    const aiResponse = await brain.askJarvis(timerPrompt, [...allhistory, ...history]);
    
    if (aiResponse.answer) {
        await logAndSay(aiResponse.answer);
    }
    return; // Выходим, чтобы не делать повторный запрос ниже
}



            // СИСТЕМНЫЙ СКАНЕР (Исправлено)
            const systemKeywords = ["пинг", "сеть", "интернет", "система", "температур", "процессор"];
            if (systemKeywords.some(k => clean.includes(k))) {
                addLog("Reading telemetry...");
                const res = await fetch('http://localhost:8000/stats');
                const s = await res.json();
                const clears = Object.fromEntries(
                Object.entries(s).map(([key, value]) => [
                    key, 
                    key === 'network' ? value : parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
                ])
);
                setStats(clears);
                
                isSystemQuery = true;
                // Формируем жесткий контекст для ИИ, чтобы он не галлюцинировал
                finalPrompt = `[DATA_SCAN]: CPU_${clears.cpu_temp}C, GPU_${clears.gpu_temp}C, RAM_${clears.ram}%, NET_DL_${clears.network.download_mbps}Mbps, NET_UL_${clears.network.upload_mbps}Mbps, Top_Process_${clears.network.top_process}, top_process_mbps ${clears.network.top_process_mbps}$. 
                               USER_QUERY: "${clean}". 
                               INSTRUCTION: Сделай краткий отчет на основе этих цифр.`;
            }

            // Запрос к мозгу (передаем уже обновленный finalPrompt)
            const aiResponse = await brain.askJarvis(finalPrompt, [...allhistory, ...history]);
            
            // Выполнение логических действий (музыка, приложения и т.д.)
            const actionResult = await logic(aiResponse, addLog, setAnim, logAndSay, timerControls,setHistory);

            if (actionResult?.type === 'stop') return;
            if (actionResult?.type === 'system_stats') {
                setStats(actionResult.data);
                if (isSystemQuery) addLog(`Telemetry sync complete.`);
                return;
            }

            // Обновление истории
            const currentExchange = [
                { role: "user", parts: [{ text: clean }] },
                { role: "model", parts: [{ text: JSON.stringify(aiResponse) }] }
            ];
            setHistory(prev => [...prev, ...currentExchange].slice(-10));

            if (clean.includes("запомни")) setallhistory(prev => [...prev, ...currentExchange]);
            if (clean.includes("очисти память")) {
                setallhistory([]);
                setHistory([]);
                localStorage.removeItem('jarvis_long_term_memory');
            }

        } catch (error) {
            addLog("Critical failure in Command Module");
            console.error(error);
        } finally {
            setTimeout(() => {
                setAnim(false);
                isProcessing.current = false;
                setCurrentTranscript("");
            }, 3000);
        }
    }, [allhistory, history, logAndSay,timerControls]);
    // --- СТАБИЛИЗАЦИЯ МИКРОФОНА ---
    const commandRef = useRef(handleCommand);
    useEffect(() => { commandRef.current = handleCommand; }, [handleCommand]);

    const stableDispatch = useCallback((txt, log) => {
        commandRef.current(txt, log);
    }, []);

    useSpeech(stableDispatch, setAnim);
    // --- РЕНДЕР ---
    const coilIndices = Array.from({ length: 10 });
    const plateIndices = Array.from({ length: 6 });

    return (
        <div className="main-wrapper">
            <ProgressBars stats={stats} />
            <ProgressNetwork stats={stats.network} />
            <div className="reactor-container">
                <h1 className="title">J.A.R.V.I.S.</h1>
                <Terminal setStats={setStats}/>
                
                <div className={`arc-reactor ${anim ? 'thinking' : ''}`}>
                   
                    <div className="reactor-bg-image"></div>
                    <div className="plates-layer">
                        {plateIndices.map((_, i) => <div key={`p-${i}`} className="metal-plate"></div>)}
                    </div>
                    <div className="coils-layer">
                        {coilIndices.map((_, i) => (
                            <div key={`c-${i}`} className="coil-assembly">
                                <div className="coil-bracket"></div>
                                <div className="coil-wires"></div>
                            </div>
                        ))}
                    </div>
                    <div className="reactor-core-group">
                        <div className="core-plasma-ring"></div>
                        <div className="core-singularity"></div>
                    </div>
                    <div className="stark-industry-label">Arc Reactor Mark 3</div>
                </div>
            </div>
        </div>
    );
};

export default Sphere;

