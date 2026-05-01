import { useEffect,useState } from "react";
import '../styles/progresbars.css';
const ProgressBars = ({ stats }) => {
  // Используем данные напрямую из пропсов для производительности
  const { 
    cpu = 0,  
    cpu_temp = 0, gpu_temp = 0 ,
    ram = 0
  } = stats || {};

  const Bar = ({ label, value, unit, isTemp }) => {
    // Если температура > 100, добавляем класс 'warning'
    //внимание температура гпу это не температура всей карты а ее хотспот
    const isWarning = isTemp && value > 100;
    
    return (
      <div className={`jarvis-item ${isWarning ? 'warning' : ''}`}>
        <div className="jarvis-info">
          <span className="jarvis-label">{label}</span>
          <span className="jarvis-number">{value}{unit}</span>
        </div>
        <div className="jarvis-track">
          <div 
            className="jarvis-fill" 
            style={{ width: `${Math.min(value, 100)}%` }}
          >
            <div className="jarvis-glitch"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="jarvis-panel">
      <Bar label="CPU LOAD" value={cpu} unit="%" />
      <Bar label="RAM LOAD" value={ram} unit="%" />
      <Bar label="CPU TEMP" value={cpu_temp} unit="°C" isTemp />
      <Bar label="GPU HOT_SPOT" value={gpu_temp} unit="°C" isTemp />
    </div>
  );
};
export default ProgressBars;