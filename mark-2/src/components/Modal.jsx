import React, { useState } from 'react';

const JarvisModal = ({ openModal, closeModal }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
// моя логика  
   // Данные форм
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pwd2FA, setPwd2FA] = useState('');
  
  // Технические данные от Telegram
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
const handleInitialize = async () => {
  setLoading(true);
  try {
    const response = await fetch(`http://localhost:8000/api/tg/init-config?api_id=${apiId}&api_hash=${apiHash}`, {
      method: 'POST'
    });
    const data = await response.json();
    if (data.status === 'initialized') {
      setStep(2); // Переходим дальше только если бэк подтвердил ключи
    } else {
      alert("Ошибка инициализации ключей");
    }
  } catch (err) {
    alert("Сервер не отвечает");
  } finally {
    setLoading(false);
  }
};
  // Шаг 2: Отправка номера телефона и получение hash
  const handleSendCode = async () => {
  setLoading(true);
  try {
    const response = await fetch('http://localhost:8000/api/tg/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone }) // ОСТАВЛЯЕМ ТОЛЬКО ТЕЛЕФОН
    });
    const data = await response.json();
    
    if (data.phone_code_hash) { // Проверяем наличие хеша
      setPhoneCodeHash(data.phone_code_hash);
      setStep(3);
    } else {
      alert(`Ошибка: ${data.message || 'Не удалось отправить код'}`);
    }
  } catch (err) {
    alert("Ошибка соединения");
  } finally {
    setLoading(false);
  }
};

  // Шаг 3: Верификация кода
  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/tg/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          code: code,
          phone_code_hash: phoneCodeHash,
          password: pwd2FA
        })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        alert('Система авторизована!');
        closeModal();
      } else {
        alert(`Ошибка: ${data.message}`);
      }
    } catch (err) {
      alert("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  if (!openModal) return null;
  // все дальше сделал ии
// ОБЪЕКТ СО СТИЛЯМИ
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: 'monospace',
    },
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '500px',
      backgroundColor: '#010c15',
      border: '2px solid #00f3ff',
      boxShadow: '0 0 25px rgba(0, 243, 255, 0.3)',
      color: '#00f3ff',
      padding: '32px',
      boxSizing: 'border-box',
    },
    corner: {
      position: 'absolute',
      width: '16px',
      height: '16px',
      borderColor: '#00f3ff',
      borderStyle: 'solid',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
      paddingBottom: '16px',
      marginBottom: '24px',
    },
    input: {
      width: '100%',
      backgroundColor: '#021526',
      border: '1px solid rgba(0, 243, 255, 0.4)',
      padding: '12px',
      color: '#00f3ff',
      outline: 'none',
      marginBottom: '16px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    buttonMain: {
      width: '100%',
      backgroundColor: 'transparent',
      border: '1px solid #00f3ff',
      color: '#00f3ff',
      padding: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      transition: '0.3s',
    },
    buttonBack: {
      flex: 1,
      backgroundColor: 'transparent',
      border: '1px solid rgba(255, 0, 0, 0.4)',
      color: '#ff4444',
      padding: '12px',
      cursor: 'pointer',
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      marginBottom: '20px',
      opacity: 0.6
    }
  };
 return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Декоративные уголки */}
        <div style={{ ...styles.corner, top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }} />
        <div style={{ ...styles.corner, top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }} />
        <div style={{ ...styles.corner, bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }} />
        <div style={{ ...styles.corner, bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }} />

        {/* Заголовок */}
        <div style={styles.header}>
          <div>
            <div style={{ fontSize: '10px', color: '#ffffff', letterSpacing: '2px' }}>SYSTEM PROTOCOL</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>[ JARVIS_AUTH_SYSTEM ]</div>
          </div>
          <button 
            onClick={closeModal} 
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Индикатор шагов */}
        <div style={styles.stepIndicator}>
          <span style={step === 1 ? { textDecoration: 'underline', color: '#00f3ff' } : {}}>01. API_CONFIG</span>
          <span style={step === 2 ? { textDecoration: 'underline', color: '#00f3ff' } : {}}>02. PHONE_LINK</span>
          <span style={step === 3 ? { textDecoration: 'underline', color: '#00f3ff' } : {}}>03. FINAL_ACCESS</span>
        </div>

        {/* Контент */}
        <div style={{ minHeight: '180px' }}>
          {step === 1 && (
            <div>
              <input 
                style={styles.input} type="text" placeholder="API_ID" 
                value={apiId} onChange={(e) => setApiId(e.target.value)} 
              />
              <input 
                style={styles.input} type="text" placeholder="API_HASH" 
                value={apiHash} onChange={(e) => setApiHash(e.target.value)} 
              />
              <button 
                style={styles.buttonMain} 
  onClick={handleInitialize} // Вызываем новую функцию
  disabled={loading}
              >
                {loading ? "INITIALIZING..." : "[ NEXT_STEP ]"}
                [ NEXT_STEP ]
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <input 
                style={styles.input} type="tel" placeholder="79991234567" 
                value={phone} onChange={(e) => setPhone(e.target.value)} 
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.buttonBack} onClick={() => setStep(1)}>BACK</button>
                <button 
                  style={{ ...styles.buttonMain, flex: 2 }} 
                  onClick={() => {
                     handleSendCode(); // вызываем вашу функцию
                     setStep(3);       // переходим на шаг с кодом
                  }}
                  disabled={loading}
                >
                  {loading ? "SENDING..." : "[ GET_CODE ]"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <input 
                style={{ ...styles.input, textAlign: 'center', letterSpacing: '8px', fontSize: '18px' }} 
                type="text" placeholder="CODE" 
                value={code} onChange={(e) => setCode(e.target.value)} 
              />
              <input 
                style={styles.input}  placeholder="2FA PASSWORD" 
                value={pwd2FA} onChange={(e) => setPwd2FA(e.target.value)} 
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.buttonBack} onClick={() => setStep(2)}>BACK</button>
                <button 
                  style={{ ...styles.buttonMain, flex: 2, boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)' }} 
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? "VERIFYING..." : "[ ACCESS_GRANTED ]"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div style={{ 
          marginTop: '30px', 
          paddingTop: '15px', 
          borderTop: '1px solid rgba(0, 243, 255, 0.1)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '9px', 
          opacity: 0.4 
        }}>
          <span>CONNECTION: ENCRYPTED</span>
          <span>ST-ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default JarvisModal;