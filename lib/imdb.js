var downcache = require("downcache"),
	request = require("request"),
	cheerio = require("cheerio"),
	log = require("npmlog"),
	url = require("url"),
	decode = require('ent/decode');

log.level = "info";

downcache.set({ dir: "/Users/cwilson1130/Desktop/oscars/", index: true });

// match a user-inputed to the most likely query
var resolve = module.exports.resolve = function(type, name, callback) {
	var url = "http://www.imdb.com/xml/find?json=1&nr=1&" + (type==="title"? "tt" : "nm") + "=on&q=" + name;
	downcache(url, function(err, resp, body) {
		var suggestions = JSON.parse(body);
		if (!suggestions) {
			log.error("No response", url);
			return;
		}
		var key = type + "_popular";
		if (suggestions[key]) {
			log.info("Matched input '" + name + "' to " + suggestions[key][0][type] + " (" + suggestions[key][0].description.replace(/<.*?>/g,"").replace(/\s+/g, " ") + ")");
			callback(suggestions[key][0].id);
			return;
		}
	});
}

module.exports.actor = function(args, callback) {
	if (args.id) {
		get_actor_by_id(args.actor_id, callback);
	} else if (args.name) {
		resolve("name", args.name, function(id) {
			get_actor_by_id(id, callback);
		});
	}
}

module.exports.movie = function(args, callback) {
	if (args.id) {
		get_movie_by_id(args.actor_id, callback);
	} else if (args.name) {
		resolve("title", args.name, function(id) {
			get_movie_by_id(id, callback);
		});
	}
}

module.exports.oscars = require("./imdb/oscars.js");

var get_actor_by_id = module.exports.actor_by_id = require("./imdb/actor.js");

var get_movie_by_id = module.exports.movie_by_id = require("./imdb/movie.js");
