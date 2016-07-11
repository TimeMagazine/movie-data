var downcache = require("downcache");
var cheerio = require("cheerio");
var BASE = "http://www.imdb.com";

var shows = [];
var movies = [];

var get_movies_page = function(url, callback, terminal) {

	// function to evaluate when to stop recursing
	terminal = terminal || function() { return false; }

	var isTerminal = false;

	//console.log(url);

	downcache(BASE + url, function(err, resp, body) {
		var $ = cheerio.load(body);
		$(".results > tr").each(function(i, v) {
			if (!$(v).hasClass("detailed")) {
				return;
			}

			console.log($(v).find("td.title > a").text().trim());
			var movie = {
				title: $(v).find("td.title > a").text().trim(),
				imdb:  $(v).find("td.title > a").attr("href").split("/")[2],
				year:  parseInt($(v).find(".year_type").text().replace("(", "").replace(")","").trim()),
				gross: $(v).find("td.sort_col").text().trim(),
				genres: [],
				summary: $(v).find(".outline").text().trim(),
				runtime: parseInt($(v).find(".runtime").text().replace(" mins.", "").trim())
			};

			movie.revenue = parseFloat(movie.gross.replace(/[^0-9\.]+/g, "")) || 0;
			if (movie.gross.slice(-1) === "B") {
				movie.revenue *= 1000000000;
			} else if (movie.gross.slice(-1) === "M") {
				movie.revenue *= 1000000;
			} else if (movie.gross.slice(-1) === "K") {
				movie.revenue *= 1000;
			}

			// genres
			$(v).find(".genre a").each(function(ii, vv) {
				movie.genres.push($(vv).text().trim());
			});

			// rating
			var rating = $(v).find(".certificate span");
			if (rating.length) {
				movie.rating = rating.attr("title").replace("_", " ");
			} else {
				movie.rating = "N/A";
			}

			// stars
			var stars = $(v).find(".rating");
			if (stars.length) {
				movie.stars = parseFloat(stars.attr("id").split("|")[2]);
			} else {
				movie.stars = "N/A";
			}

			isTerminal = terminal(movie);
			if (!isTerminal && movie.revenue) {
				movies.push(movie);
			}
		});

		var pagination = $(".pagination a").last();
		if ($(pagination).html().split("&")[0] == "Next" && !isTerminal) {
			get_movies_page($(pagination).attr("href"), callback, terminal);
		} else {
			callback(movies);
		}
	});
}


var get_tvshows_page = function(url, callback, terminal) {
	// function to evaluate when to stop recursing
	terminal = terminal || function() { return false; }

	//console.log(url);

	downcache(BASE + url, function(err, resp, body) {
		//console.log(BASE + url);
		var $ = cheerio.load(body, {
			decodeEntities: false // $num was getting converted to '#''
		});

		$(".results > tr").each(function(i, v) {
			if (!$(v).hasClass("detailed")) {
				return;
			}
			shows.push({
				title: $(v).find("td.title > a").text().trim(),
				link:  $(v).find("td.title > a").attr("href").split("/")[2],
				rating: parseFloat($(v).find(".rating-rating .value").text().trim())
			});
		});

		var pagination = $(".pagination a").last();
		if ($(pagination).html().split("&")[0] == "Next" && !terminal(shows)) {
			get_tvshows_page($(pagination).attr("href"), callback, terminal);
		} else {
			callback(shows);
		}
	});
}

module.exports = {
	movies: function(callback, terminal) {
		callback = callback || function(d) { console.log(d); }
		get_movies_page("/search/title?at=0&countries=us&sort=boxoffice_gross_us&start=1", callback, terminal);
	},
	tvshows: function(callback, terminal) {
		callback = callback || function(d) { console.log(d); }
		get_tvshows_page("/search/title?at=0&num_votes=5000,&sort=user_rating&title_type=tv_series", callback, terminal);
	}
};