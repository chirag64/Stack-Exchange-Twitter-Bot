// Dependencies
var request = require('request'),
	TwitterBot = require('node-twitterbot').TwitterBot;

// Config options
const POSTS_PER_INTERVAL = 1,
	INTERVAL_MINUTES = 30,
	MAX_TWEET_TEXT_COUNT = 116;

// Twitter Bot credentials
var Bot = new TwitterBot({
	'consumer_secret': 'consumer_secret',
	'consumer_key': 'consumer_key',
	'access_token': 'access_token',
	'access_token_secret': 'access_token_secret'
}),
	marker = {},
	url = 'https://stackexchange.com/hot-questions-for-mobile';

SEBot();
setInterval(SEBot, (INTERVAL_MINUTES * 60 * 1000));

function SEBot() {
	request({
		url: url,
		json: true
	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			// Erase posts made 2 days ago from local memory
			marker[DayBeforeYesterday()] = undefined;

			// Initialize array for today's marker if it is not initialized already
			if (marker[Today()] === undefined) {
				marker[Today()] = {};
			}
			if (marker[Yesterday()] === undefined) {
				marker[Yesterday()] = {};
			}

			var posts = body;
			// console.log(posts);
			var current_interval_posts = 0;

			// Go through all the SE posts that have been fetched from SE API earlier
			for (i = 0; i < posts.length && current_interval_posts < POSTS_PER_INTERVAL; i++) {
				if (marker[Today()][posts[i].question_id] === undefined && marker[Yesterday()][posts[i].question_id] === undefined) {
					marker[Today()][posts[i].question_id] = true;
					current_interval_posts++;

					var linkSuffix = ' https://' + posts[i].site + '/questions/' + posts[i].question_id;
					var title = posts[i].title;

					// Trim the title if total tweet length exceeds 140 characters
					while (title.length > MAX_TWEET_TEXT_COUNT) {
						title = title.substring(0, title.lastIndexOf(' ')) + '...';
					}

					// Post tweet
					var twitter_post = title + linkSuffix;

					console.log(new Date().getHours() + ':' + new Date().getMinutes() + ' - ' + twitter_post);
					var tweetAction = Bot.addAction('tweet', function (twitter, action, tweet) {
						Bot.tweet(twitter_post);
					});
					Bot.now(tweetAction);
				}
			}
		}
		else {
			console.error('An error occurred while fetching data from: \'' + url + '\'\nResponse: \'' + response.statusCode + '\'\n' + error);
		}
	})
}

// Returns the date in YYYYMMDD format of the date 48 hours ago
function DayBeforeYesterday() {
	var day = new Date();
	day.setDate(day.getDate() - 2);
	return day.toISOString().substring(0, 10);
}

// Returns the date in YYYYMMDD format of the date 48 hours ago
function Yesterday() {
	var day = new Date();
	day.setDate(day.getDate() - 1);
	return day.toISOString().substring(0, 10);
}

// Returns the current date in YYYYMMDD format
function Today() {
	var day = new Date();
	return day.toISOString().substring(0, 10);
}