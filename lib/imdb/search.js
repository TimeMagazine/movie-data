var downcache = require("downcache"),
	cheerio = require("cheerio");

module.exports = function(keyword, callback) {
	var pg = 1,
		last_pg = 101,
		movies = [];
	
	(function loop() {
		if (pg <= last_pg) {
		    if (keyword){
		    	var url = 'http://www.imdb.com/search/title?count=100&keywords='+keyword+'&start='+pg+'&title_type=feature';
		    } else {
		    	var url = 'http://www.imdb.com/search/title?count=100&start='+pg+'&title_type=feature';
		    }
			
			downcache(url, function (err, response, body) {
				if (err) {
					console.log(err);
					callback(null);
				}
				var $ = cheerio.load(body);
				// Check for next button, otherwise script finishes
				if ($('.pagination').text().indexOf('Next') > -1){
					last_pg += 100;
				};
				
				$('table.results tr.detailed').each(function(i, d){			
					var movie = $(d).find('td.title').children('a');

					if (movie.length){
						var	id = $(movie).attr('href').split('/')[2],
							name = $(movie).text();
							movies.push({id: id, name: name});
						// console.log($(d).find('td.number').text(), name);
					};
				});
				pg += 100;
				loop();
			});

			if (pg == last_pg){
				callback(movies)
			}
		}
	}());
}