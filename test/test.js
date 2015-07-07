var imdb = require("../lib/imdb");

imdb.actor({ name: "Benedict Cumberbatch" }, function(actor) {
	//console.log(actor);
});

imdb.by_keyword("sequel", function(movies) {
	console.log(movies);
});

