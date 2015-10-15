var downcache = require("downcache"),
	cheerio = require("cheerio"),
	url = require("url"),
	decode = require('ent/decode');

/* given imdb ID, return actor info as json */

module.exports = function(actor_id, callback) {
	downcache("http://www.imdb.com/name/" + actor_id, { log: "verbose" }, function(err, resp, body) {
		if (err) {
			console.error(err);
			return;
		}

		var $ = cheerio.load(body);
		var actor = {
			id: actor_id,
			name: $("#name-overview-widget h1 span:nth-child(1)").text().trim(),
			imdb_photo: $("#name-overview-widget a img").attr("src"),
			movies: []
		};

		/* FILMOGRAPHY */
		// we want the div that comes after the header for "actor" under filmography section
		var filmography = $("#filmo-head-actor,#filmo-head-actress").next();
		filmography.find(".filmo-row").each(function(i, v) {
			var movie = {
				year: $(v).find(".year_column").html().replace("&#xA0;", "").trim(),
				name: $(v).find("b a").html().trim(),
				id: $(v).find("b a").attr("href").split("/")[2],
				characters: {}
			};

			// eventually need to allow for non-hyperlinked characters
			$(v).find("a").each(function(i, a) {
				if (/\/character\//.test($(a).attr("href"))) {
					movie.characters[$(a).attr("href").split("/")[2]] = $(a).text().trim();
				}
			})

			// hacky regex to deal with weird IMDB markup
			var match = $(v).html().match(/\/b\>\n\((.*?)\)/),
				type = "Movie",
				status = null;

			if (match) {
				if (match[1].trim().indexOf("<") !== -1) {
					status = $(match[1]).text().trim();
				} else {
					type = match[1].trim();
				}
			}
			movie.type = type;
			movie.status = status;
			actor.movies.push(movie);
		});

		/* BIO */
		downcache("http://www.imdb.com/name/" + actor_id + "/bio", function(err, resp, body) {
			actor.stats = {};
			var $ = cheerio.load(body);
			$("#overviewTable tr").each(function(i, v) {
				var stat = $(v).find("td:nth-child(1)").text().trim(),
					value = $(v).find("td:nth-child(2)").html(),
					values = $(v).find($(v).find("td:nth-child(2) > a"));

				// if regular old text
				if (!values.length) {
					actor.stats[stat] = value.split("<br>").map(function(d) { return decode(d.trim()); });
					if (actor.stats[stat].length === 1) {
						actor.stats[stat] = actor.stats[stat][0];
					}
				} else {
					actor.stats[stat] = {};					
					values.each(function(i, a) {
						var query = url.parse($(a).attr("href"), true).query;
						Object.keys(query).forEach(function(key) {
							if (!/ref/.test(key)) {
								actor.stats[stat][key] = query[key];
							}
						})
					});
				}
			});

			var pronouns = {
				her: 0,
				she: 0,
				his: 0,
				he: 0
			}

			$("div.soda.odd	p").each(function(i, v) {
				for (var pronoun in pronouns) {
					var regex = new RegExp("\\b" + pronoun + "\\b", "ig");
					var matches = $(v).html().match(regex);
					if (matches) {
						pronouns[pronoun] += matches.length;
					}
				}
			});

			if ((pronouns.she + pronouns.her) > (pronouns.he + pronouns.his)) {
				actor.stats.gender_guess = "female";
			} else if ((pronouns.she + pronouns.her) < (pronouns.he + pronouns.his)) {
				actor.stats.gender_guess = "male";				
			}


			callback(actor);
		});
	});
}