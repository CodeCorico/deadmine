(function() {
  const REDMINE_URL = 'http://redmine.aramisauto.com/';
  const panels = {};
  let issueOpened = null;
  let clone = null;
  let issueOpening = false;

  const queryBubbleByClass = (el, className) => {
    if (el.className.split(' ').indexOf(className) > -1) {
      return el;
    }

    if (el.parentNode === window.document.body) {
      return null;
    }

    return queryBubbleByClass(el.parentNode, className);
  };

  const insertFonts = () => {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css?family=Source+Code+Pro:300,400,600&display=swap';

    window.document.head.appendChild(link);
  };

  const createPanel = (name, src) => {
    const iframeContainer = document.createElement('div');
    iframeContainer.className = `deadmine-issue-panel panel-${name}`;
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

    window.document.querySelector('.container-fixed').classList.add('fade');
    window.document.body.parentNode.classList.add('fixed');

    setTimeout(() => {
      clone.classList.add('featured');

      setTimeout(() => {
        clone.classList.add('fixed');

        setTimeout(() => {
          createPanel('description', `${REDMINE_URL}issues/${id}/?display=description`);

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
    window.document.querySelector('.container-fixed').classList.remove('fade');

    destroyPanels('description');

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

  insertFonts();
  handleIssuesEvents();
  fixGravatars();
})();
