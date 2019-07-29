(function(window) {
  console.log('ok');
  if (window.parent === window) {
    console.log('fuck');
    return;
  }

  const FILTER_IDS = {
    // assignees: [428, 414, 371, 375, 377, 130, 388, 358, 397, 408],
    reviewers: [428, 414, 371, 375, 377, 130, 388, 358, 397, 408],
    testers: [428, 414, 371, 375, 377, 130, 388, 358, 397, 408],
  };

  const membersHTML = (html, members, filterName) => {
    members.forEach((member) => {
      if (!member.src || member.name.indexOf('<<') === 0 || (FILTER_IDS[filterName] && FILTER_IDS[filterName].indexOf(parseInt(member.id, 10)) < 0)) {
        return;
      }

      html += `<img src="${member.src}" class="ironmine-avatar ${member.selected ? 'selected' : ''}" title="${member.name + ' ' + member.id}" />`;
    });

    return html;
  };

  const retrieveMembers = (selector) => {
    const array = [];

    window.document.querySelectorAll(`${selector} > option`).forEach((el) => {
      const id = el.getAttribute('value');

      array.push({
        id,
        selected: !!el.getAttribute('selected'),
        src: usersIds[id] && usersIds[id].src || false,
        name: el.textContent,
      });
    });

    return array;
  }

  const usersIds = window.parent.IRONMINE.usersIds();
  console.log(usersIds);
  const assignees = retrieveMembers('#issue_assigned_to_id');
  const reviewers = retrieveMembers('#issue_custom_field_values_97');
  const testers = retrieveMembers('#issue_custom_field_values_98');

  const membersSelector = window.document.createElement('div');
  membersSelector.className = 'ironmine-members-selector';

  let html = '<div class="ironmine-members panel-assignees">';

  html = membersHTML(html, assignees, 'assignees');

  html += '</div><div class="ironmine-members panel-reviewers">';

  html = membersHTML(html, reviewers, 'reviewers');

  html += '</div><div class="ironmine-members panel-testers">';

  html = membersHTML(html, testers, 'testers');

  html += '</div>';

  membersSelector.innerHTML = html;

  window.document.body.appendChild(membersSelector)
})(this);
