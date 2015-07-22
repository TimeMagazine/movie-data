var downcache = require("downcache"),
	cheerio = require("cheerio"),
	url = require("url"),
	decode = require('ent/decode');

/* given imdb ID, return actor info as json */

var inflation = require('../../src/inflation.json');

// downcache.set("log", "verbose");
module.exports = function(title_id, name, callback) {

	downcache("http://www.imdb.com/title/" + title_id, function(err, resp, body) {
		if (err) {
			console.log(err);
			callback(null);
			return;
		}

		var $ = cheerio.load(body);
		var releaseDate = $("#title-overview-widget .infobar").find('a').last().text().split('(')[0]
		var movie = {
			id: title_id,
			name: $("#title-overview-widget h1 span:nth-child(1)").text().trim(),
			date: releaseDate,
			imdb_photo: $("#title-overview-widgeta img").attr("src"),
			genre1: $("#title-overview-widget .infobar").find('.itemprop').first().text(),
			genre2: $("#title-overview-widget .infobar").find('.itemprop').eq(1).text(),
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
		//we want the full page, not the abbreviated cast
		downcache("http://www.imdb.com/title/" + title_id + "/business", function(err, resp, body) {
			var releaseYear = parseInt(movie.date.substring(movie.date.length-5, movie.date.length));
			if (err) {
				console.log('error: ', err);
				callback(null);
				return;
			}
			var $ = cheerio.load(body);
			var grossValues = [];
			
			$("#tn15content").find("*").each(function(i, v) {
				if (v.children.length && v.children[0].data === "Gross") {
					// Loop through each <br> to catch values witout date links, e.g. Godfather: http://www.imdb.com/title/tt0068646/business
					$(v).nextAll('br').each(function(i,d){
						if (d.prev.data && d.prev.data.match(/\d+/g) && d.prev.data.indexOf('(USA') > -1){
							movie.finance.country = 'USA';
							var amt = parseInt(d.prev.data.split('(USA)')[0].replace(/[,\$]/g,''))
							var yr = d.prev.data.split('(USA)')[1].match(/\d+/g)
							if (yr && Math.abs(yr[0] - releaseYear) <= 2){
								grossValues.push(amt);
							} else {
								// console.log('No year value found for ' + movie.name);
								// This retains values that don't have a specific year
								grossValues.push(amt);
							}
						}
					});
					// Loop through each year to find one closest to release year
					$(v).nextAll('a').each(function(i,d){
						if (!isNaN( $(d).text().trim() )) { // filter out month strings
							var grossYear = parseInt($(d).text());
							if (Math.abs(grossYear - releaseYear) <= 2){
								if (d.prev.prev.prev.data){
									var amount = parseInt(d.prev.prev.prev.data.replace(/\$/g,'').split('(')[0].replace(/,/g, ''))		
									movie.finance.country = /\(([A-z]+)\)/.exec(v.next.data) == null ?  '' : /\(([A-z]+)\)/.exec(v.next.data)[1]							
									if (!isNaN(amount)){grossValues.push(amount)};
								}
							}
						}
					});
				}
				if (i == $("#tn15content").find("*").length -1){
					// Reduce array to highest value
					if (grossValues.length){
						var highestGross = grossValues.reduce(function(a,b){ return a > b ? a:b});
						var inflationRate = (inflation['2015']-parseFloat(inflation[releaseYear]))/parseFloat(inflation[releaseYear]);
						movie.finance.inflated_gross = parseFloat(highestGross) + parseFloat(highestGross * inflationRate);
						movie.finance.original_gross = highestGross;
					} else {
						console.log('No box office figure found for '+ movie.name+' within two years of '+ releaseYear);
					}
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
			if (err) {
				console.log('error: ', err);
				callback(null);
				return;
			}
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