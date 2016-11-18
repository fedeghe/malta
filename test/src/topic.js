var topic = (function () {
	var name;
	function _setName(n){name = n;}
	function _getName(){return name;}
	return {
		setName : _setName,
		getName : _getName
	};
})();