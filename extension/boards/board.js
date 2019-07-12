(function(window) {
  const REDMINE_URL = 'http://redmine.aramisauto.com/';

  // in seconds
  const REFRESH_INTERVAL = 30;
  const panels = {};
  const users = {};
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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css?family=Source+Code+Pro:300,400,600&display=swap';

    window.document.head.appendChild(link);
  };

  const injectBody = () => {
    ['top', 'bottom'].forEach((direction) => {
      const div = document.createElement('div');
      div.className = `body-effect-${direction}`;

      window.document.body.insertBefore(div, window.document.body.childNodes[0]);
    });
  };

  const extractUsers = () => {
    window.document.querySelectorAll('.project-members > .assignable-user').forEach((userEl) => {
      const link = userEl.querySelector('a');
      const name = (link ? link.textContent : userEl.textContent).trim();
      const src = userEl.querySelector('img').getAttribute('src');
      users[name] = src;
    });
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

  const activatePanel = (name) => {
    if (!panels[name]) {
      return;
    }

    const iframe = panels[name].querySelector('iframe');
    const activate = () => {
      panels[name].classList.add('open');

      setTimeout(() => panels[name].classList.add('active'), 200);
    }

    if (iframe.contentDocument.readyState === 'complete') {
      activate();
    } else {
      iframe.contentWindow.onload = () => activate();
    }
  };

  const deactivatePanel = (name) => {
    if (!panels[name]) {
      return;
    }

    panels[name].classList.remove('active');
    setTimeout(() => panels[name].classList.remove('open'), 200);
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
    // window.document.body.parentNode.classList.add('fixed');

    createPanel('description', `${REDMINE_URL}issues/${id}/?display=description`);
    createPanel('comments', `${REDMINE_URL}issues/${id}/?tab=comments&display=comments`);

    setTimeout(() => {
      clone.classList.add('featured');

      setTimeout(() => {
        clone.classList.add('fixed');

        setTimeout(() => {
          activatePanel('description');
          activatePanel('comments');

          issueOpening = false;
        }, 250);
      }, 250);
    });
  };

  const closeIssue = () => {
    if (!issueOpened || issueOpening) {
      return;
    }

    issueOpening = true;

    deactivatePanel('description');
    deactivatePanel('comments');

    setTimeout(() => {
      clone.classList.remove('fixed');

      setTimeout(() => {
        destroyPanels('description', 'comments');
        clone.classList.remove('featured');
        window.document.querySelector('.agile-board').classList.remove('fade');

        setTimeout(() => {
          issueOpened.classList.remove('hidden');
          clone.parentNode.removeChild(clone);
          // window.document.body.parentNode.classList.remove('fixed');
          clone = null;
          issueOpened = null;

          issueOpening = false;
        }, 350);
      }, 350);
    }, 350);
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
    if (!window.document.querySelector('.lock')) {
      return;
    }

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

        const dataHtml = data
          .replace(/name="authenticity_token" value=".*?"/g, 'name="authenticity_token" value="null"')

        if (dataHtml === lastRefreshHTML) {
          return;
        }

        lastRefreshHTML = dataHtml;

        const html = dataHtml
          .replace(/\n/g, '')
          .replace(/<b>SP API<\/b>:.*?<br>/g, '')
          .replace(/<b>Avancement<\/b>:.*?<br>/g, '')
          .replace(/<span class="hours">\(([0-9]+)sp\)<\/span>/g, '<span class="hours">$1</span>')
          .replace(/<span class="hours">\((.*?).00h\/0sp\)<\/span>/g, '<span class="hours">$1h</span>')
          .replace(/<span class="hours">\((.*?).00h\)<\/span>/g, '<span class="hours">$1h</span>')
          .replace(/<span class="hours">\((.*?)h\/0sp\)<\/span>/g, '<span class="hours">$1h</span>')
          .replace('data-column-id="1">Nouveau (', 'data-column-id="1">A faire (')
          .replace('data-column-id="2">Analyse (', 'data-column-id="2">Conception (')
          .replace('data-column-id="3">Traitement (', 'data-column-id="3">En cours (')
          .replace('data-column-id="5">Prêt à déployer (', 'data-column-id="5">Awesome (')
          .replace(/class="fields"(.*?)class="quick-comment"/g, (searchFields) => {
            const members = [];

            const fieldsHtml = searchFields
              .replace(/<b>Revue de code<\/b>:(.*?)<br>/g, (searchMembers) => {
                searchMembers.replace(/<a.*?>(.*?)<\/a>/g, (a, searchMember) => {
                  const member = searchMember.trim();
                  if (members.indexOf(member) < 0) {
                    members.push(member);
                  }
                });

                return '';
              })
              .replace(/<b>Recette fonctionnelle<\/b>:(.*?)<br>/g, (searchMembers) => {
                searchMembers.replace(/<a.*?>(.*?)<\/a>/g, (a, searchMember) => {
                  const member = searchMember.trim();
                  if (members.indexOf(member) < 0) {
                    members.push(member);
                  }
                });

                return '';
              });

            if (!members.length) {
              return fieldsHtml;
            }

            return fieldsHtml.replace(
              /<p class="info assigned-user"(.*?)<\/p>/g,
              (searchUsers) => searchUsers.replace('</p>', () => {
                const membersHtml = members.map((member) => users[member]
                  ? `<span class="user">
                    <img alt="" title="" class="gravatar" src="${users[member]}">
                  </span>`
                  : ''
                ).join('');

                return `${membersHtml}</p>`;
              })
            );
          })
          .replace(/default=/g, 'default=robohash')
          .replace(/(;|&)size=.*?&/g, '$1size=100&');

        $('#content').html(html);
      },
      fail: () => {
        changeRefreshStatus(false);
      },
      complete: () => {
        window.document.querySelector('.agile-board.autoscroll').scrollTop = lastScrollPosition;

        handleLockChanges();
        handleIssuesEvents();
      },
    });

    refreshTimeout = setTimeout(() => startRefresh(), REFRESH_INTERVAL * 1000);
  };

  injectFonts();
  injectBody();
  injectRefreshStatusComponent();
  extractUsers();
  handleLockChanges();
  handleIssuesEvents();

  startRefresh();
})(this);
