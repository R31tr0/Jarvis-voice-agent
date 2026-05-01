export const say = (text) => {
  if (!window.speechSynthesis) return;

  // Очистка текста
  const cleanText = text.replace(/^Джарвис:\s*/i, '');
  
  // Получаем голоса
  let voices = window.speechSynthesis.getVoices();

  const msg = new SpeechSynthesisUtterance(cleanText);

  // 1. ПРОВЕРКА: Если голоса еще не загружены
  if (voices.length === 0) {
    // Ждем 100мс и пробуем еще раз (рекурсия)
    setTimeout(() => say(text), 100);
    return;
  }

  // 2. ПОИСК: Более гибкий поиск голоса
  const jarvisVoice = voices.find(v => v.name.includes('Google русский')) || voices[20];
  
  if (jarvisVoice) {
    msg.voice = jarvisVoice;
  }

  // 3. НАСТРОЙКИ: 
  msg.volume = 1;
  msg.rate = 1.0; 
  msg.pitch = 0.8; // Оптимальный баритон. 0.55 может звучать как демон из подвала.
  msg.lang = 'ru-RU';

  // 4. ЗАПУСК
  window.speechSynthesis.cancel();
  
  // Небольшая задержка перед речью, чтобы браузер успел сбросить очередь
  setTimeout(() => {
    window.speechSynthesis.speak(msg);
  }, 50);
};