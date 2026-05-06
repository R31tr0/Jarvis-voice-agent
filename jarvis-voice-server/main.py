
import uvicorn
from fastapi import FastAPI,Header, HTTPException,BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import subprocess
import psutil
import wmi
import os
import sys
import io
import base64
import pyautogui
import pyperclip
import time
import asyncio
import subprocess
# import google.generativeai as genai
from pydantic import BaseModel
import AppOpener
from AppOpener import close
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError
import requests
import httpx
import json


# Принудительно устанавливаем стандартный вывод в UTF-8 для корректных логов
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

app = FastAPI()

# Настройка CORS для связи с React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- КОНФИГУРАЦИЯ ---
MODEL_PATH = "models/dmitri/ru_RU-dmitri-medium.onnx"
OUTPUT_PATH = "output.wav"
LIMIT_SECONDS = 2 * 3600  # Лимит: 2 часа

# Файл, где мы будем хранить ключи
CONFIG_FILE = "tg_config.json"
# --- CONFIG ---
# В будущем подтяните это из вашего config.json
API_ID = 0
API_HASH = 0
client = None
# Создаем клиента, но НЕ запускаем его сразу



# --- TELEGRAM EVENTS ---


# Список отслеживаемых процессов
TARGET_PROCESSES = [
    # Riot Games
    'VALORANT-Win64-Shipping.exe', 'VALORANT.exe', 'RiotClientServices.exe',
    'League of Legends.exe', 'LeagueClient.exe', 'LeagueClientUX.exe',
    
    # Valve (Source / Source 2)
    'cs2.exe', 'csgo.exe', 'dota2.exe', 'hl2.exe', 'portal2.exe', 'left4dead2.exe',
    
    # Minecraft (Java & Bedrock)
    'javaw.exe', 'java.exe', 'Minecraft.Windows.exe', 'Minecraft.exe', 'MinecraftLauncher.exe',
    
    # Roblox & Epic Games
    'RobloxPlayerBeta.exe', 'RobloxPlayerLauncher.exe', 'FortniteClient-Win64-Shipping.exe',
    
    # Resident Evil & Capcom
    're2.exe', 're3.exe', 're4.exe', 're7.exe', 're8.exe', 're_chunk_bin.exe','PRAGMATA','PRAGMATA.exe'
    
    # Шутеры и Battle Royale
    'Overwatch.exe', 'r5apex.exe', 'TslGame.exe', 'EscapeFromTarkov.exe', 'BsgLauncher.exe',
    
    # Популярные движки и платформы
    'GenshinImpact.exe', 'StarRail.exe', 'Cyberpunk2077.exe', 'Witcher3.exe', 'GTA5.exe',
    'EuroTrucks2.exe', 'DeadByDaylight-Win64-Shipping.exe'
]

# --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
game_warning_flag = False
start_time = None
has_new_tg_msg = False

class ClipboardData(BaseModel):
    text: str
class VoiceRequest(BaseModel):
    text: str
class PhoneRequest(BaseModel):
    phone: str

class VerifyRequest(BaseModel):
    phone: str
    code: str
    phone_code_hash: str
    password: str = None  # Необязательно, если нет 2FA
class TelegramMsg(BaseModel):
    sender: str
    content: str

    # Хранилище для последних сообщений (чтобы фронт мог их забрать)
latest_notification = None
# Глобальные переменные для хранения истории
last_net_io = psutil.net_io_counters()
last_proc_io = {}

def get_network_load():
    global last_net_io, last_proc_io
    
    # 1. Общая статистика
    current_net_io = psutil.net_io_counters()
    sent_per_sec = current_net_io.bytes_sent - last_net_io.bytes_sent
    recv_per_sec = current_net_io.bytes_recv - last_net_io.bytes_recv
    last_net_io = current_net_io
    
    mbps_sent = round((sent_per_sec * 8) / (1024 * 1024), 2)
    mbps_recv = round((recv_per_sec * 8) / (1024 * 1024), 2)

    # 2. Поиск процесса
    top_proc_name = "System"
    top_proc_pid = 0
    max_diff = 0
    new_proc_io = {} # Временный словарь
    
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            pid = proc.info['pid']
            current_io = proc.io_counters().other_bytes
            new_proc_io[pid] = current_io # Сохраняем только активные PID
            
            if pid in last_proc_io:
                diff = current_io - last_proc_io[pid]
                if diff > max_diff:
                    max_diff = diff
                    top_proc_name = proc.info['name']
                    top_proc_pid = pid
        except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
            continue
            
    last_proc_io = new_proc_io # Полностью заменяем старый словарь новым (очистка)
    top_proc_mbps = round((max_diff * 8) / (1024 * 1024), 2)

    return {
        "upload_mbps": mbps_sent,
        "download_mbps": mbps_recv,
        "top_process": top_proc_name,
        "top_process_pid": top_proc_pid,
        "top_process_mbps": top_proc_mbps
    }


# --- МОДУЛЬ КОНТРОЛЯ ИГРОВОГО ВРЕМЕНИ (ФОНОВЫЙ)  моя логика ---
async def track_games_task():
    global game_warning_flag, start_time
    print("[SYSTEM]: Модуль контроля игрового времени активен.")
    
    while True:
        found = False
        try:
            # Сканируем запущенные процессы
            for proc in psutil.process_iter(['name']):
                name = proc.info['name']
                if name and name.lower() in TARGET_PROCESSES:
                    found = True
                    break
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

        if found:
            if start_time is None:
                start_time = time.time()
                print(f"[GAMING]: Обнаружена игра. Начало отсчета.")
            
            elapsed = time.time() - start_time
            if elapsed >= LIMIT_SECONDS:
                game_warning_flag = True
                # Здесь можно добавить логику автоматической озвучки через Piper в будущем
        else:
            if start_time is not None:
                print("[GAMING]: Игра закрыта. Таймер сброшен.")
                start_time = None
                game_warning_flag = False

        # Проверка каждые 30 секунд, не нагружая процессор
        await asyncio.sleep(30)
async def handle_incoming_telegram(event):
    if event.is_private:
        sender = await event.get_sender()
        name = sender.first_name or "Unknown"
        text = event.message.message
        print(f"Новое сообщение от {name}: {text}")
        async with httpx.AsyncClient() as ac:
            await ac.post('http://localhost:8000/api/notify', json={
                "type": "TELEGRAM_MESSAGE", "sender": name, "content": text
            })



# Запуск фонового процесса при старте сервера (Запуск ТГ вместе с сервером)
@app.on_event("startup")
async def startup_event():
    global client, API_ID, API_HASH
    asyncio.create_task(track_games_task())
    
    # 1. Проверяем, есть ли сохраненный конфиг
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
                API_ID = config.get("api_id")
                API_HASH = config.get("api_hash")
            
            if API_ID and API_HASH:
                print(f"[SYSTEM]: Загрузка конфигурации из {CONFIG_FILE}...")
                client = TelegramClient('jarvis_session', API_ID, API_HASH)
                
                # Регистрируем обработчик ОДИН раз
                @client.on(events.NewMessage(incoming=True))
                async def internal_handler(event):
                    # Просто вызываем нашу общую функцию
                    await handle_incoming_telegram(event)
                
                await client.connect()
                
                # Проверяем, авторизованы ли мы уже (есть ли файл .session)
                if await client.is_user_authorized():
                    print("[SYSTEM]: Джарвис успешно авторизован и готов к работе!")
                else:
                    print("[SYSTEM]: Ключи загружены, но сессия устарела. Нужен вход по телефону.")
        except Exception as e:
            print(f"[ERROR]: Не удалось загрузить конфиг: {e}")
    else:
        print("[SYSTEM]: Сохраненных настроек нет. Жду первой регистрации...")
# --- ЭНДПОИНТЫ ---
# СЕКЦИЯ С ТЕЛЕГРАМ КЛИЕНТОМ (ИНИЦИАЛИЗАЦИЯ И ОБРАБОТКА СОБЫТИЙ) ОЧЕНЬ ХРУПКАЯ И СЛОЖНАЯ ПОЛОВИНА ЛОГИКИ ЭТО ИИ ----------------







def get_client(api_id, api_hash):
    global client
    if client:
        # Если клиент уже был, отключаем старый перед созданием нового
        # (это важно, если юзер ввел неверные ключи и хочет исправить)
        pass 
    return TelegramClient('jarvis_session', api_id, api_hash)
@app.post("/api/tg/init-config")
async def init_tg_config(api_id: int, api_hash: str):
    global client, API_ID, API_HASH
    API_ID = api_id
    API_HASH = api_hash
    
# СОХРАНЯЕМ НА ДИСК
    with open(CONFIG_FILE, "w") as f:
        json.dump({"api_id": API_ID, "api_hash": API_HASH}, f)

    try:
        # СОЗДАЕМ КЛИЕНТА ТОЛЬКО ТУТ
        client = TelegramClient('jarvis_session', API_ID, API_HASH)
        
        # РЕГИСТРИРУЕМ СОБЫТИЯ ВНУТРИ
        @client.on(events.NewMessage(incoming=True))
        async def internal_handler(event):
            if event.is_private:
                sender = await event.get_sender()
                name = sender.first_name or "Unknown"
                text = event.message.message
                print(f"Новое сообщение от {name}: {text}")
                async with httpx.AsyncClient() as ac:
                    await ac.post('http://localhost:8000/api/notify', json={
                        "type": "TELEGRAM_MESSAGE", "sender": name, "content": text
                    })
            
        await client.connect()
        return {"status": "initialized", "message": "Ключи приняты, Джарвис готов!"}
    except Exception as e:
        return {"status": "error", "message": f"Ошибка инициализации: {str(e)}"}

@app.post("/api/tg/send-code")
async def send_code(data: PhoneRequest):
    global client
    if client is None:
        raise HTTPException(status_code=400, detail="Сначала настройте API ключи!")
    
    if not client.is_connected():
        await client.connect()
    
    try:
        # Отправляем код, используя данные из JSON
        result = await client.send_code_request(data.phone)
        return {"phone_code_hash": result.phone_code_hash, "status": "code_sent"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@app.post("/api/tg/verify-code")
async def verify_code(data: VerifyRequest):
    global client
    try:
        # Берем всё из data
        await client.sign_in(
            data.phone, 
            data.code, 
            phone_code_hash=data.phone_code_hash
        )
        return {"status": "success", "message": "Авторизация завершена!"}
    
    except SessionPasswordNeededError:
        if data.password:
            await client.sign_in(password=data.password)
            return {"status": "success", "message": "Авторизация по 2FA успешна!"}
        return {"status": "password_required", "message": "Введите ваш облачный пароль"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
    







    # КОНЕЦ СЕКЦИИИ С ТЕЛЕГРАМ КЛИЕНТОМ (ИНИЦИАЛИЗАЦИЯ И ОБРАБОТКА СОБЫТИЙ) ОЧЕНЬ ХРУПКАЯ И СЛОЖНАЯ ПОЛОВИНА ЛОГИКИ ЭТО ИИ ----------------
@app.get("/screenshot")
async def take_screenshot(x_jarvis_token: str = Header(None)):
    if x_jarvis_token != "my-ultra-secret-key-777": # Сверяем токен 
        raise HTTPException(status_code=403, detail="Доступ запрещен, сэр.")
    try:
        screenshot = pyautogui.screenshot() # Делаем скриншот
        buffer = io.BytesIO() # Создаем буфер для хранения изображения в памяти
        screenshot.save(buffer, format="PNG") # Сохранение в буфер в формате PNG
        buffer.seek(0) # Сброс позиции в начале буфера
        img_str = base64.b64encode(buffer.read()).decode('utf-8') # Кодируем в base64 строку
        return {"screenshot": img_str} # Возвращаем строку в формате JSON
    except Exception as e:
        return {"error": str(e)}
@app.post("/clipboardfixed")
async def update_clipboard(data: ClipboardData):
    new_text = data.text
    if not new_text:
        return {"error": "Текст пуст, Сэр."}
    pyperclip.copy(new_text)  # Копируем исправленный текст в буфер
    return {
        "fixed_clipboard": new_text  # Возвращаем исправленный текст от ИИ
    }

@app.get("/clipboard")
async def get_clipboard():
    raw_text = pyperclip.paste()
    if not raw_text:
        print("Буфер пуст, Сэр.")
        return {"clipboard": ""}  # Возвращаем пустую строку вместо None
    print(f"Буфер обмена содержит: {raw_text[:50]}...")
    return {
        "clipboard": raw_text  # Только текст из буфера, без pyperclip.copy()
    }

@app.post("/api/notify")
async def receive_notification(msg: TelegramMsg):
    global latest_notification
    global has_new_tg_msg
    latest_notification = {"sender": msg.sender, "text": msg.content}
    msg.content = msg.content if len(msg.content) <= 50 else msg.content[:47] + "..." # Ограничиваем длину для логов
    print(f"Джарвис получил сообщение для озвучки: {msg.sender}")
    has_new_tg_msg = True  # Зажигаем лампочку!
    return {"status": "ok"}
@app.get("/api/get-notification")
async def get_notification():
    global latest_notification
    temp = latest_notification
    latest_notification = None # Очищаем после выдачи
    return temp

@app.get("/close")
async def close_application(name: str, x_jarvis_token: str = Header(None)):
    # 1. Сверяем токен
    if x_jarvis_token != "my-ultra-secret-key-777":
        raise HTTPException(
            status_code=403, detail="Доступ запрещен, сэр."
        )
    
    # Очищаем имя от лишних пробелов
    app_name = name.strip()
    
    try:
        # output=False отключает лишние принты AppOpener в консоль сервера
        # match_closest=True помогает, если пришло "хром" вместо "google chrome"
        close(app_name, match_closest=True, output=False)
        
        success_msg = f"Приложение {app_name} закрыто, сэр."
        # Если generate_voice_logic — это async функция для озвучки:
        await generate_voice_logic(success_msg)
        
        return {
            "status": "success",
            "message": f"закрыто приложение: {app_name}",
        }
        
    except Exception as e:
        error_msg = f"Не удалось закрыть {app_name}, сэр. Ошибка в процессе."
        await generate_voice_logic(error_msg)
        return {"status": "error", "message": str(e)}

@app.get("/open")
async def open_application(name: str, x_jarvis_token: str = Header(None)):
    # 1. Сверяем токен
    if x_jarvis_token != "my-ultra-secret-key-777":
        raise HTTPException(
            status_code=403, detail="Доступ запрещен, сэр."
        )

    name_lower = name.lower().strip()
            

    # 2. ПРОВЕРКА НА FULLSCREEN (Развертывание окна)
    if name_lower == "fullscreen":
        pyautogui.hotkey(
            "win", "up"
        )  # Комбинация клавиш для развертывания окна
        await generate_voice_logic("Развернула окно на весь экран")
        return {
            "status": "success",
            "message": "Окно развернуто на весь экран",
        }

    # 3. Специальная логика для "запретов" и "обходов"
    if "запрет" in name_lower or "обход" in name_lower:
        file_path = r"C:\Users\Retr0\Desktop\zapret\general (SIMPLE FAKE).bat"
        os.startfile(file_path)
        return {"status": "batch file launched"}

    # 4. Обычный запуск приложения
    try:
        # Используем исходное имя (name), чтобы AppOpener корректно искал программу
        #, match_closest=True
        AppOpener.open(name, match_closest=True)
    except Exception as e:
        error_msg = f"Не удалось открыть {name}, сэр. Приложение не найдено."
        await generate_voice_logic(error_msg)
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "message": f"Открыто приложение: {name}",
    }

# Добавлен эндпоинт для GET запросов (исправляет ошибку 405)
@app.get("/say")
async def say_get(text: str):
    return await generate_voice_logic(text)

@app.post("/say")
async def say_post(request: VoiceRequest):
    return await generate_voice_logic(request.text)

@app.get("/stats")
async def get_stats():
    # Сбор температуры через OpenHardwareMonitor
    cpu_t, gpu_t = "N/A", "N/A"
    try:
        w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
        sensors = w.Sensor()
        for sensor in sensors:
            if sensor.SensorType == u'Temperature':
                # Исправлена логика присвоения переменных
                if 'CPU' in sensor.Name: cpu_t = f"{sensor.Value}°C"
                elif 'GPU' in sensor.Name: gpu_t = f"{sensor.Value}°C"
    except:
        cpu_t, gpu_t = "Locked", "Locked"

    played_min = round((time.time() - start_time) / 60) if start_time else 0

    return {
        "cpu": f"{psutil.cpu_percent(interval=0.1)}%", 
        "cpu_temp": cpu_t,
        "gpu_temp": gpu_t,
        "ram": f"{psutil.virtual_memory().percent}%",
        "battery": psutil.sensors_battery().percent if psutil.sensors_battery() else "AC",
        "game_warning": game_warning_flag,
        "time_played_min": played_min,
        "has_new_tg_msg": has_new_tg_msg,
        "network": get_network_load(),
    }
voice_enabled = True
@app.get("/toggle_voice")
async def toggle_voice(status: bool):
    global voice_enabled
    voice_enabled = status
    state = "включена" if voice_enabled else "выключена"
    return {"message": f"Озвучка {state}"}
@app.get("/listen")
async def listen():
     # Если озвучка выключена, можем запретить даже отдавать файл
    if not voice_enabled:
        return {"error": "Озвучка отключена в настройках"}
    if os.path.exists(OUTPUT_PATH):
        return FileResponse(OUTPUT_PATH, media_type="audio/wav")
    return {"error": "Файл еще не создан"}
# --- ЛОГИКА ГОЛОСА ---
async def generate_voice_logic(text: str):
    # Используем путь к текущему запущенному python.exe (автоматически найдет venv)
    python_exe = sys.executable 
    my_env = os.environ.copy()
    my_env["PYTHONIOENCODING"] = "utf-8"

    # Проверяем, что файл модели на месте
    if not os.path.exists(MODEL_PATH):
        return {"status": "error", "message": f"Модель не найдена по пути: {MODEL_PATH}"}

    command = [
        python_exe, "-m", "piper",
        "--model", MODEL_PATH,
        "--output_file", OUTPUT_PATH
    ]
    
    try:
        process = subprocess.Popen(
            command, 
            stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            env=my_env,
            text=False
        )
        
        stdout, stderr = process.communicate(input=text.encode('utf-8'))
        
        if process.returncode != 0:
            return {"status": "error", "message": stderr.decode('utf-8', errors='ignore')}

        return {
            "status": "success", 
            "audio_url": "http://localhost:8000/listen",
            "message": f"Озвучено: {text}"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

    
