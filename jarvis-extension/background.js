// Слушаем команды от нашего локального сайта
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.command === "next_track") {
    chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: () => {
            // ТА САМАЯ ОДНА СТРОЧКА: Находим кнопку "Next" и кликаем
            document.querySelector('.ytp-next-button')?.click();
          }
        });
      }
    });
  }
  if(message.command === "before_track"){
     chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: () => {
            // ТА САМАЯ ОДНА СТРОЧКА: Находим кнопку "Next" и кликаем
            document.querySelector('.ytp-prev-button')?.click();
          }
        });
      }
         })
                                        }
 if(message.command === "stop_track"){
     chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: () => {
            // ТА САМАЯ ОДНА СТРОЧКА: Находим кнопку "Next" и кликаем
            document.querySelector('.ytp-play-button')?.click();
          }
        });
      }
         })
                                        }


if(message.command === "volume_track"){
     chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          func: () => {
            // ТА САМАЯ ОДНА СТРОЧКА: Находим кнопку "Next" и кликаем
            document.querySelector('.ytp-mute-button')?.click();
          }
        });
      }
         })
                                        }

// Увеличить громкость на 10%
if (message.command === "volume_up") {
  chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
    if (tabs.length > 0) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          const video = document.querySelector('video');
          if (video) {
            video.volume = Math.min(1, video.volume + 0.1);
            video.muted = false; // Включаем звук, если был Mute
          }
        }
      });
    }
  });
}

// Уменьшить громкость на 10%
if (message.command === "volume_down") {
  chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
    if (tabs.length > 0) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          const video = document.querySelector('video');
          if (video) {
            video.volume = Math.max(0, video.volume - 0.1);
          }
        }
      });
    }
  });
  
}//версия ии для использованрия медж .команд  релизовал 
if(message.command === "set_volume"){
 chrome.tabs.query({url:"*://*.youtube.com/*" },(tabs)=>{
 if (tabs.length > 0) {
chrome.scripting.executeScript({
target: {tabId: tabs[0].id},
func: (soundvalue) =>{

  const video  = document.querySelector('video');
          if (video) {
            // Конвертируем 20 в 0.2 (так как JS понимает от 0 до 1)
            video.volume = soundvalue / 100;
            video.muted = false;
          }
          
      },
      args: [message.value]//передаемданные из сообщ в тело функции
    })
  }
 }) 
}
                                                                          });