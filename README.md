<div align="center">

# 🤖 J.A.R.V.I.S. Project (Mark 3)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" style="for-the-badge" />
</p>

*Продвинутый персональный ИИ-ассистент с агентской архитектурой, поддержкой мультимодельности (анализ изображений), управлением браузерным окружением и кастомным интерфейсом.*

</div>

---

## 🛠 Технологический стек

- **Frontend:** React, TypeScript, Vite, Framer Motion
- **Core & AI Model:** Google Gemma 3 (27B) / мультимодельный подход через Google AI Studio.
- **Интеграции:** Кастомное расширение для Google Chrome (управление вкладками и медиа).

---

## 🧠 Особенности логики и AI

- **Мультимодельность:** Ассистент способен анализировать не только текст, но и изображения.
- **Оптимизация лимитов:** Общение и задачи распределены между разными моделями, чтобы снизить нагрузку на API-лимиты.
- **⚠️ Важно о доступности:** Google часто ограничивает доступ к API из РФ. Для стабильной работы **необходим рабочий VPN**.

---

## ⚙️ Настройка API-ключа

Для запуска системы вам понадобится собственный ключ от Google AI Studio:
1. Получите бесплатный ключ на официальном сайте: [Google AI Studio](https://aistudio.google.com/)
2. Откройте файл проекта `mark-2/src/logic/brain.js`.
3. Вставьте ваш API-ключ в соответствующую переменную и проверьте настройки системного `PROMPT`.

---

## 🚀 Запуск проекта

> **⚠️ Системное требование:** Проект запускается **исключительно на ОС Windows** через специальный скрипт автоматизации.
> Для запуска всей системы просто используйте файл **`start_jarvis.bat`** в корневой папке.

* **Системные метрики:** Чтобы ассистент мог считывать расширенные показатели железа (а не только базовые нативные метрики), в системе должен быть установлен **Open Hardware Monitor**.

---

## ⚡ Архитектура проекта

```text
📦 jarvis-project
  ┣ 📂 jarvis-extension/          # Расширение для браузера (управление окружением и вкладками)
  ┃  ┣ 📜 background.js           # Фоновый скрипт расширения
  ┃  ┗ 📜 manifest.json           # Манифест расширения (конфигурация)
  ┃
  ┣ 📂 jarvis-voice-server/       # Серверная часть, голосовой движок и интеграции
  ┃  ┣ 📂 models/                 # Локальные модели / веса для обработки голоса
  ┃  ┣ 📜 main.py                 # Основной бэкенд-сервер 
  ┃  ┣ 📜 output.wav              # Файл генерации/вывода аудио
  ┃  ┗ 📜 tg_bridge.py            # Мост для интеграции с Telegram
  ┃
  ┗ 📂 mark-2/                    # Фронтенд-приложение 
     ┣ 📂 public/                 # Статические файлы
     ┗ 📂 src/                    # Исходный код интерфейса
        ┣ 📂 assets/              # Медиафайлы, изображения, шрифты
        ┣ 📂 components/          # UI-компоненты интерфейса
        ┣ 📂 hooks/               # Пользовательские React-хуки
        ┣ 📂 logic/               # Бизнес-логика и взаимодействие с нейросетью
        ┣ 📂 styles/              # Таблицы стилей и оформление
        ┣ 📜 App.jsx              # Главный корневой компонент
        ┗ 📜 main.jsx             # Точка входа React-приложения
