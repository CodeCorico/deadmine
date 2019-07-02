(function() {
	// const message = (name, data) =>
	// 	window.top.postMessage(Object.assign({ name }, data || {}), 'http://localhost:8080');

	// window.addEventListener('message', (event) => {
	//
	// }, false);

	const test = window.document.createElement('div');
	test.innerHTML = '<div style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); background: red; color: white;">Injected</div>';
	window.document.body.appendChild(test);

	// message('url', { pathname: window.location.pathname });
})();
