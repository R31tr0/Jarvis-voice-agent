import { useEffect,useState } from "react";
import '../styles/progresbars.css';
const ProgressNetwork = ({ stats }) => {
  // Используем данные напрямую из пропсов для производительности
  const { 
   upload_mbps = 0,
   download_mbps = 0,top_process_mbps = 0
  } = stats || {};

  const Bar = ({ label, value, unit, isTemp }) => {
    // Если температура > 80, добавляем класс 'warning'
    const isWarning = isTemp && value > 80;
    
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
    <div className="jarvis-panel-network">
      <Bar label="UPLOAD" value={upload_mbps} unit="Mbps" />
      <Bar label="DOWNLOAD" value={download_mbps} unit="Mbps" />
      <Bar label="TOP PROCESS" value={top_process_mbps} unit="Mbps" />
    </div>
  );
};
export default ProgressNetwork;