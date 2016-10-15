var Readable = require('stream').Readable;
var util = require('util');
util.inherits(MyStream, Readable);
function MyStream(opt) {
	Readable.call(this, opt);
}
MyStream.prototype._read = function() {};

process.__defineGetter__('stdin', function() {
	if (process.__stdin) return process.__stdin;
	process.__stdin = new MyStream();
	return process.__stdin;
});

var gui = require('nw.gui');
var win = gui.Window.get();

win.showDevTools();
