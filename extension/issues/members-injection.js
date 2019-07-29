const script = document.createElement('script');
script.src = chrome.runtime.getURL('issues/members.js');
(document.head || document.documentElement).appendChild(script);
