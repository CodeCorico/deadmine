const script = document.createElement('script');
script.src = chrome.runtime.getURL('boards/board.js');
(document.head || document.documentElement).appendChild(script);
