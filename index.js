var fs = require("fs"),
	imdb = require("./lib/imdb.js");

if (require.main === module) {
	var argv = require('minimist')(process.argv.slice(2));
	if (argv._.length) {
		command = argv._[0].toLowerCase();

		if (imdb.hasOwnProperty(command)) {
			imdb[command](argv, function(response) {
				console.log(response);
			});
		}
	}
} else {
	module.exports = imdb;
}