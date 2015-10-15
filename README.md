#IMDB to JSON

This is a simple scraper that converts the relevant parts of an actor or movie page on IMDB to a JSON document. Feel free to open an issue or submit a pull request if there are parts of the page that we have not yet added to the scraper.

This module uses [downcache](https://www.npmjs.com/package/downcache) to store a local copy of each requested page on your local machine. 

## Installation

	npm install

## Command Line Usage

	# movie by vernacular name
	node index.js movie --name="The Godfather" > thegodfather.json

	# actor by vernacular name
	node index.js actor --name="Julianne Moore" > julianne_moore.json

	# movie by IDMB id
	node index.js movie --id=tt0074281 > carwash.json

	# actor by IDMB id
	node index.js actor --id=nm0001640 > richard_pryor.json

In the first two cases, the script uses the [undocumented IMDB search API](http://stackoverflow.com/a/7744369/1779735) to resolve the input to a page. It's anecdotally very accurate, but be careful if you're running a large number of names through it to check them afterward.

## API Usage

	var imdb = require("movie-data");

	imdb.actor_by_id("nm0001640", function(actor) {
		console.log(actor);
	});

	// other methods are "actor", "movie", "movie_by_id"

### Downcache usage

By default, downcache creates a local directory named "cache" for storing the HTML pages you request. You can adjust downcache's settings from the parent script if you so desire:

	var imdb = require("movie-data"),
		downcache = require("downcache");

	downcache.set({
		dir: "/Users/myname/Desktop/movies/",
		log: "verbose"
	});	


	imdb.movie("Mean Girls", function(movie) {
		console.log(movie);
	});

##JSON

The JSON should be fairly self explanatory. Here's are condensed examples:

	{ id: 'tt0068646',
	  name: 'The Godfather',
	  date: '1972',
	  imdb_photo: 'http://ia.media-imdb.com/images/M/MV5BMjEyMjcyNDI4MF5BMl5BanBnXkFtZTcwMDA5Mzg3OA@@._V1_SX214_AL_.jpg',
	  info: 
	   { director: [ [Object] ],
	     writers: [ [Object], [Object] ],
	     stars: [ [Object], [Object], [Object] ] },
	  actors: 
	   [ { name: 'Marlon Brando',
	       id: 'nm0000008',
	       character: 'Don Vito Corleone' },
	     { name: 'Al Pacino',
	       id: 'nm0000199',
	       character: 'Michael Corleone' },
	     { name: 'James Caan',
	       id: 'nm0001001',
	       character: 'Sonny Corleone' },
	     { name: 'Richard S. Castellano',
	       id: 'nm0144710',
	   ...

And an actor readout:

	{ id: 'nm0000194',
	  name: 'Julianne Moore',
	  imdb_photo: 'http://ia.media-imdb.com/images/M/MV5BMTM5NDI1MjE2Ml5BMl5BanBnXkFtZTgwNDE0Nzk0MDE@._V1_SY317_CR7,0,214,317_AL_.jpg',
	  movies: 
	   [ { year: '2015',
	       name: 'Maggie&apos;s Plan',
	       id: 'tt3471098',
	       characters: {},
	       type: 'Movie',
	       status: 'filming' },
	     { year: '2015',
	       name: 'The Hunger Games: Mockingjay - Part 2',
	       id: 'tt1951266',
	       characters: [Object],
	       type: 'Movie',
	       status: 'post-production' },
	     { year: '2015',
	       name: 'Freeheld',
	       id: 'tt1658801',
	       characters: [Object],
	       type: 'Movie',
	       status: 'post-production' },
	     { year: '2014/I',
	       name: 'Seventh Son',
	       id: 'tt1121096',
	       characters: [Object],
	       type: 'Movie',
	       status: null },
	     { year: '2014',
	       name: 'The Hunger Games: Mockingjay - Part 1',
	       id: 'tt1951265',
	       characters: [Object],
	       type: 'Movie',
	       status: null },
	     { year: '2014',
	       name: 'Still Alice',
	       id: 'tt3316960',
	       characters: [Object],
	       type: 'Movie',
	       status: null },
	     { year: '2014',
	       name: 'Maps to the Stars',
	       id: 'tt2172584',
	       characters: [Object],
	       type: 'Movie',
	       status: null },
	     { year: '1987',
	       name: 'I&apos;ll Take Manhattan',
	       id: 'tt0092378',
	       characters: [Object],
	       type: 'TV Mini-Series',
	       status: null } ],
	  stats: 
	   { 'Date of Birth': 
	      { birth_monthday: '12-3',
	        birth_year: '1960',
	        birth_place: 'Fayetteville, North Carolina, USA' },
	     'Birth Name': 'Julie Anne Smith',
	     Nickname: 'Juli',
	     Height: '5\' 4" (1.63 m)' } }
