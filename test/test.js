var imdb = require("../lib/imdb");

imdb.actor({ name: "Benedict Cumberbatch" }, function(actor) {
	console.log(actor);
});