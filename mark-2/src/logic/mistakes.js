import useSpeech from "../hooks/useSpeachToText";

const controller = (command) => {
  if (!command) return "";

  let processed = command.toLowerCase().trim();

  const vocabulary = [
    { 
      ru: "джарвис",
      // Важно: перечисляем от длинных слов к коротким
      wrong: ["жарвис", "джерес", "джервис", "жарвес", "джерри", "завис", "жары", "джар","джеррис","джары","джаред"] 
    },
  ];

  vocabulary.forEach(item => {
    item.wrong.forEach(badWord => {
      // Создаем регулярное выражение, которое ищет точное совпадение слова
      // Используем конструкцию, которая заменяет badWord на ru, 
      // только если badWord не является частью уже исправленного "джарвис"
      const regex = new RegExp(`\\b${badWord}\\b`, 'gi'); 
      
      // Если ваше окружение плохо поддерживает кириллические границы слов \b,
      // используем более надежный метод для русского языка:
      //ии предоставило альтарнотивное /b реешение тк как оно проверяет точно слово и не трогает и слеш б не всегда работает
      processed = processed.split(' ').map(word => {
        return badWord === word ? item.ru : word;
      }).join(' ');
    });
  });

  return processed.trim();
};

export default controller;



