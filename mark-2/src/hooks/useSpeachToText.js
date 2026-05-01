import { useEffect, useRef } from 'react';
import { useLogs } from './useLogs.jsx';
import controller from '../logic/mistakes.js';

const useSpeech = (onCommand, setAnim) => {
  const { addLog } = useLogs();
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);
  const isRecognizingRef = useRef(false);
  
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      addLog("Браузер не поддерживает SpeechRecognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true; // Включаем промежуточные результаты, чтобы микрофон не останавливался при молчании

    const startRecognition = () => {
      if (isRecognizingRef.current) return;
      try {
        recognition.start();
      } catch (e) {
        console.error("SpeechRecognition failed to start:", e);
        addLog(`Не удалось включить микрофон: ${e.message || e}`);
      }
    };

    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      isRecognizingRef.current = true;
      addLog("SpeechRecognition активен");
    };

    recognition.onresult = (event) => {
      if (!isMountedRef.current) return;

      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];

      if (result.isFinal) {
        const rawText = result[0].transcript.toLowerCase().trim();
        if (!rawText) return;

        const cleanTranscript = controller(rawText);

        if (cleanTranscript.includes('джарвис')) {
          addLog(`Команда принята: "${cleanTranscript}"`);
          if (onCommandRef.current) {
            onCommandRef.current(cleanTranscript, addLog);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.warn(`[AUDIO] Ошибка: ${event.error}`);
      addLog(`SpeechRecognition error: ${event.error}`);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        addLog('Микрофон отключен или доступ запрещен браузером.');
      }
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      isRecognizingRef.current = false;
      addLog("SpeechRecognition остановлен — пытаюсь перезапустить");
      setTimeout(() => {
        if (isMountedRef.current) {
          startRecognition();
        }
      }, 100);
    };

    startRecognition();

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return null;
};

export default useSpeech;