var downcache = require("downcache"),
	cheerio = require("cheerio"),
	url = require("url"),
	decode = require('ent/decode');

/* given imdb ID, return actor info as json */

module.exports = function(title_id, callback) {
	downcache("http://www.imdb.com/title/" + title_id, function(err, resp, body) {
		if (err) {
			console.log(err);
			callback(null);
		}
		var $ = cheerio.load(body);
		var movie = {
			id: title_id,
			name: $("#title-overview-widget h1 span:nth-child(1)").text().trim(),
			date: $("#title-overview-widget h1 span:nth-child(2)").text().trim().replace("(", "").replace(")", ""),
			imdb_photo: $("#title-overview-widget a img").attr("src"),
			info: {},
			finance: {},
			actors: [],
			keywords: []
		};

		// director, writer, stars, etc.
		$("#overview-top .txt-block").each(function(i, v) {
			var key = $(v).find("h4").text().trim().replace(":", "").toLowerCase();
			var values = [];
			$(v).find("a").each(function(i, v) {
				if (/nm\d+/.test($(v).attr("href"))) {
					values.push({
						name: $(v).text().trim(),
						id: $(v).attr("href").split("/")[2]
					});
				}
				movie.info[key] = values;
			});
		});

		var callback_count = 3;

		/* FINANCE */
		// we want the full page, not the abbreviated cast
		downcache("http://www.imdb.com/title/" + title_id + "/business", function(err, resp, body) {
			var $ = cheerio.load(body);

			$("#tn15content").find("*").each(function(i, v) {
				if (v.children.length && v.children[0].data === "Gross") {
					movie.finance.gross = parseInt(v.next.data.replace(/[^0-9]+/g, ""), 10);
					movie.finance.country = /\(([A-z]+)\)/.exec(v.next.data)[1];
				}
			});

			callback_count -= 1;
			if (!callback_count) {
				callback(movie);
			}
		});

		/* CAST */
		// we want the full page, not the abbreviated cast
		downcache("http://www.imdb.com/title/" + title_id + "/fullcredits", function(err, resp, body) {
			var $ = cheerio.load(body);
			var filmography = $(".cast_list");
			filmography.find("tr.even,tr.odd").each(function(i, v) {
				var actor = {
					name: $(v).find("td:nth-child(2) a span").text().trim().replace(/\s+/g, " "),
					id:   $(v).find("td:nth-child(2) a").attr("href").split("/")[2],
					character: $(v).find("td:nth-child(4)").text().trim().replace(/\s+/g, " ")
				};
				movie.actors.push(actor);
			});
			callback_count -= 1;
			if (!callback_count) {
				callback(movie);
			}
		});

		/* KEYWORDS */
		// we want the full page, not the abbreviated cast
		downcache("http://www.imdb.com/title/" + title_id + "/keywords", function(err, resp, body) {
			var $ = cheerio.load(body);
			$("#keywords_content table .sodatext > a").each(function(i, v) {
				movie.keywords.push($(v).text());
			});

			callback_count -= 1;
			if (!callback_count) {
				callback(movie);
			}
		});

	});
}