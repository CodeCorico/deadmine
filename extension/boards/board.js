(function(window) {
  const REDMINE_URL = 'http://redmine.aramisauto.com/';

  // in seconds
  const REFRESH_INTERVAL = 30;
  const panels = {};
  let issueOpened = null;
  let clone = null;
  let issueOpening = false;
  let refreshTimeout = null;
  let lastRefreshHTML = '';

  const queryBubbleByClass = (el, className) => {
    if (el.className.split(' ').indexOf(className) > -1) {
      return el;
    }

    if (el.parentNode === window.document.body) {
      return null;
    }

    return queryBubbleByClass(el.parentNode, className);
  };

  const injectFonts = () => {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css?family=Source+Code+Pro:300,400,600&display=swap';

    window.document.head.appendChild(link);
  };

  const createPanel = (name, src) => {
    const iframeContainer = document.createElement('div');
    iframeContainer.className = `ironmine-issue-panel panel-${name}`;
    iframeContainer.innerHTML = '<div></div><iframe></iframe>';
    const iframe = iframeContainer.querySelector('iframe');
    iframe.src = src;
    window.document.body.appendChild(iframeContainer);

    panels[name] = iframeContainer;
  };

  const destroyPanels = (...names) => {
    names.forEach((name) => {
      if (!panels[name]) {
        return;
      }

      panels[name].parentNode.removeChild(panels[name]);
      delete panels[name];
    })
  };

  const openIssue = (issueCard) => {
    if (!issueCard || issueOpened || issueOpening) {
      return;
    }

    issueOpening = true;
    issueOpened = issueCard;

    const id = issueCard.getAttribute('data-id');

    const rect = issueCard.getBoundingClientRect();

    clone = window.document.createElement('div');
    clone.className = 'issue-card-clone';
    clone.style.width = `${issueCard.clientWidth}px`;
    clone.style.height = `${issueCard.clientHeight}px`;
    clone.style.left = `${rect.x}px`;
    clone.style.top = `${rect.y}px`;
    clone.innerHTML = issueCard.outerHTML;
    clone.childNodes[0].onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();

      closeIssue();
    };

    window.document.body.appendChild(clone);
    issueOpened.classList.add('hidden');

    window.document.querySelector('.agile-board').classList.add('fade');
    window.document.body.parentNode.classList.add('fixed');

    setTimeout(() => {
      clone.classList.add('featured');

      setTimeout(() => {
        clone.classList.add('fixed');

        setTimeout(() => {
          createPanel('description', `${REDMINE_URL}issues/${id}/?display=description`);
          createPanel('comments', `${REDMINE_URL}issues/${id}/?tab=comments&display=comments`);

          issueOpening = false;
        }, 350);
      }, 350);
    });
  };

  const closeIssue = () => {
    if (!issueOpened || issueOpening) {
      return;
    }

    issueOpening = true;

    clone.classList.remove('featured');
    window.document.querySelector('.agile-board').classList.remove('fade');

    destroyPanels('description', 'comments');

    setTimeout(() => {
      issueOpened.classList.remove('hidden');
      clone.parentNode.removeChild(clone);
      window.document.body.parentNode.classList.remove('fixed');
      clone = null;
      issueOpened = null;

      issueOpening = false;
    }, 1000);
  };

  const toggleIssue = (issueCard) => {
    if (issueOpened) {
      closeIssue();
    } else {
      openIssue(issueCard);
    }
  }

  const handleIssuesEvents = () => {
    window.document.querySelectorAll('.issue-card').forEach((el) => {
      el.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const issueCard = queryBubbleByClass(event.target, 'issue-card');

        if (!issueCard) {
          return;
        }

        toggleIssue(issueCard);
      };
    });
  };

  const fixGravatars = () => {
    window.document.querySelectorAll('.gravatar').forEach((el) => {
      const src = el.getAttribute('src').replace(/size=.*?&/, 'size=100&');
      el.setAttribute('src', src);
      el.setAttribute('srcset', src);
    });
  };

  const handleLockChanges = () => {
    const observer = new MutationObserver(() => {
      if (window.document.querySelector('.lock').style.display !== 'none') {
        return;
      }

      handleIssuesEvents();
      fixGravatars();
    });

    observer.observe(window.document.querySelector('.lock'), { attributes: true });
  };

  const injectRefreshStatusComponent = () => {
    const refreshStatus = document.createElement('div');
    refreshStatus.className = 'refresh-status';
    window.document.body.appendChild(refreshStatus);
  };

  const changeRefreshStatus = (idle) => {
    window.document.querySelector('.refresh-status').classList[idle ? 'remove' : 'add']('error');
  };

  const startRefresh = () => {
    clearTimeout(refreshTimeout);

    const lastScrollPosition = window.document.querySelector('.agile-board.autoscroll').scrollTop;

    window.$.ajax(location.href, {
      dataType: 'html',
      success: (data) => {
        changeRefreshStatus(true);

        const html = data.replace(/name="authenticity_token" value=".*?"/g, 'name="authenticity_token" value="null"');

        if (html === lastRefreshHTML) {
          return;
        }

        lastRefreshHTML = html;
        $('#content').html(html);
      },
      fail: () => {
        changeRefreshStatus(false);
      },
      complete: () => {
        window.document.querySelector('.agile-board.autoscroll').scrollTop = lastScrollPosition;

        handleIssuesEvents();
        fixGravatars();
      },
    });

    refreshTimeout = setTimeout(() => startRefresh(), REFRESH_INTERVAL * 1000);
  };

  injectFonts();
  injectRefreshStatusComponent();
  handleLockChanges();
  handleIssuesEvents();
  fixGravatars();

  startRefresh();
})(this);
