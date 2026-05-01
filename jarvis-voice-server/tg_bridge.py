from telethon import TelegramClient, events
import requests

# ВСТАВЬТЕ ВАШИ КЛЮЧИ ТУТ
API_ID = 21409848
API_HASH = 'f27beab9e22237b6ac0713fccd9c91bb'

client = TelegramClient('jarvis_session', API_ID, API_HASH)

@client.on(events.NewMessage(incoming=True))
async def my_event_handler(event):
    if event.is_private:  # Реагируем только на личные сообщения
        sender = await event.get_sender()
        name = sender.first_name if sender.first_name else "Unknown"
        text = event.message.message
        
        print(f"Новое сообщение от {name}: {text}")
        
        # Отправляем данные на ваш локальный бэкенд (React/Node/Python API)
        # Убедитесь, что у вас поднят сервер на 8000 порту
        try:
            payload = {
                "type": "TELEGRAM_MESSAGE",
                "sender": name,
                "content": text
            }
            requests.post('http://localhost:8000/api/notify', json=payload)
        except Exception as e:
            print(f"Ошибка отправки на фронт: {e}")

print("Джарвис слушает сообщения...")
client.start()
client.run_until_disconnected()