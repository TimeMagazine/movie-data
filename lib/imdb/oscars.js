var downcache = require("downcache"),
	cheerio = require("cheerio"),
	decode = require('ent/decode');

module.exports = function(args, callback) {
	var alternates = require(__dirname + "/alternates.json"),
		years = args.years? args.years.split(",") : null;

	downcache("http://www.imdb.com/event/ev0000003/overview", function(err, resp, body) {
		var $ = cheerio.load(body);
		$("#sidebar > div > a").each(function(i, v) {
			var year = $(v).attr("href").split("/")[3];
			if (year != "" && (!years || years.indexOf(year) !== -1)) {
				downcache("http://www.imdb.com" + $(v).attr("href"), function(err, resp, body) {
					var nominees = [];
					var $ = cheerio.load(body);
					$(".award h2").each(function(ii, vv) {
						var category = $(vv).text().trim(),
							candidates = $(vv).next().find("div.alt,div.alt2");

						candidates.each(function(iii, vvv) {
							var nominee = {
								year: parseInt(year, 10),
								category: category,
								winner: year != 2015 && iii === 0
							};

							if (alternates[nominee.category]) {
								nominee.original_category = nominee.category;
								nominee.category = alternates[nominee.category];
							}

							nominee.id = [year, nominee.category.replace(/ /g, "_"), iii].join("_");

							// in rare cases, multiple movies are cited
							var movies = $(vvv).find("strong > a");

							if (movies.length >= 1) {
								nominee.movie = [];
								movies.each(function (m, movie) {
									nominee.movie.push({
										name: $(movie).text(),
										id: $(movie).attr("href").split("/")[2]
									});
								});

								if (nominee.movie.length === 1) {
									nominee.movie = nominee.movie[0];
								} else if (nominee.movie.length == 0) {
									delete nominee.movie;
								}
							}

							var people = $(vvv).children("a");
							if (people.length >= 1) {
								nominee.names = [];
								people.each(function(i, v) {
									nominee.names.push({
										name: decode($(v).html()),
										id: $(v).attr("href").split("/")[2]
									});
								});
							}
							nominees.push(nominee);
						});
					});
					if (callback) {
						callback(nominees);
					}
				});
			}
		});
	})
}