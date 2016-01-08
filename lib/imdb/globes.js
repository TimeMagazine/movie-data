var downcache = require("downcache"),
	cheerio = require("cheerio"),
	decode = require('ent/decode'),
	fs = require("fs");

module.exports = function(args, callback) {
	var years = {};
	downcache("http://www.imdb.com/event/ev0000292/overview", function(err, resp, body) {
		var $ = cheerio.load(body);
		$("#sidebar .aux-content-widget-2:nth-child(2)").find("a").each(function(i, v) {
			var year = $(v).html(),
				href = "http://www.imdb.com" + $(v).attr("href");

			if (year.length > 4) {
				return;
			}

			if (parseInt(year, 10) < 1940) {
				return;
			}

			years[year] = {};

			downcache(href, function(err, response, body) {
				console.log(year);
				var $ = cheerio.load(body);
				$("#main .award:nth-child(2) > blockquote h2").each(function(i, v) {
					var award = {
						category: $(v).text(),
						year: year,
						nominees: []
					}

					$(v).next().find(".alt,.alt2").each(function(i, v) {
						award.nominees.push({
							show: $(v).find("strong").text().replace(":", "").trim(),
							show_id: $(v).find("strong a").attr("href")? $(v).find("strong a").attr("href").split("/")[2] : null,
							actor: $(v).find("strong").next().text(),
							actor_id: $(v).find("a").attr("href").split("/")[2],
							winner: (parseInt(year , 10) < 2016 && i == 0)? true : false
						});
					});

					if (award.nominees[0].actor != "") {
						years[year][award.category] = award;
					}
				});
				if (Object.keys(years).length == 73) {
					fs.writeFileSync("globes.json", JSON.stringify(years, null, 2));
				}
			});
		});
	})
}