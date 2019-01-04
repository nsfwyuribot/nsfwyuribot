/////////////////////////
//NSFW YURI TWITTER BOT//
/////////////////////////


// MODULES
var fs = require('fs'),
	request = require('request').defaults({encoding:null}), // 'null' causes request to output buffer instead of string
	Danbooru = require('danbooru'),
	path = require('path'),
	Twit = require('twit'),
	config = require(path.join(__dirname, 'config.js'));
	
	
// OBJECTS
const T = new Twit(config);
const booru = new Danbooru();
	
// VARIABLES
var pageNum = 1;     // Danbooru page number
var loopCounter = 1; // Global counter used in setting page number to help prevent repeats
	
// FUNCTIONS

// sleep()
// Used in async functions to wait for time specified in ms
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}


// uploadImage()
// Uploads image to Twitter and posts
function uploadImage(url, ratings, source, artist) {
	
	console.log('Uploading image...');
	
	request.get(url, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						
						// Encode data from URL into base64
						var b64Data = Buffer.from(body).toString('base64');

						// Upload image to Twitter
						T.post('media/upload', {media_data: b64Data}, function (err, data, response) {
							if (err){
							  console.log('ERROR:');
							  console.log(err);
							}
							else{
							  console.log('Image uploaded!');
							  console.log('Now tweeting it...');

						// Set tags based on rating (sfw or nsfw)
						var tweet_tags = '#yuri #sexy';
						
						if (ratings.indexOf('s') >= 0) {
							tweet_tags = '#yuri #百合 #sfw #sexy';
						} else {
							tweet_tags = '#yuri #百合 #nsfw #sexy';
						}
						  
						// Post tweet to timeline with appropriate info and tags 
						T.post('statuses/update', {
							status: 'Artist: ' + artist + '\nSource: ' + source + '\n' + tweet_tags,
							media_ids: new Array(data.media_id_string)
						  },
							function(err, data, response) {
							  if (err){
								console.log('ERROR:');
								console.log(err);
							  } else {
								console.log('Posted image successfully!');
							  }
							}
						  );
						}
					  });		
					} 
					
					// Error with request.get()
					else {
						console.log('Error posting to Twitter: ' + error);
					}
	});
}


// getPosts()
// Stores a collection of post urls from Danbooru into an array based on specific tags
async function getPosts() {
	
	console.log('\nFetching URLs from Danbooru...');
	
	//Set page number
	if (loopCounter == 0) {
		pageNum = 1;
		loopCounter = 1;
	} else if (loopCounter == 1) {
		pageNum = 210;
		loopCounter = 0;
	}
	
	// Variables
	var posts = await booru.posts({tags: 'yuri -futa', limit: 190, page: pageNum});
	var urls = [];
	var ratings = [];
	var artist = [];
	var source = [];
	var currentURL = 0;
	
	// Loop through posts array
	for (var i=0; i<posts.length; i++) {
		
		// Check for bad tags
		if (posts[i].tag_string_general.indexOf('genderswap') <0 &&		
			posts[i].tag_string_general.indexOf('bowsette')   <0 &&
			posts[i].tag_string_character.indexOf('bowsette') <0 &&
			posts[i].tag_string_general.indexOf('booette')    <0 &&
			posts[i].tag_string_character.indexOf('booette')  <0 &&			
			posts[i].tag_string_general.indexOf('1boy')       <0 && 
			posts[i].tag_string_general.indexOf('multiple_boys') <0 &&			
			posts[i].tag_string_general.indexOf('comic')      <0 &&
			posts[i].tag_string_general.indexOf('futanari')   <0 &&
			posts[i].tag_string_general.indexOf('loli')       <0 && // 'loli' and 'toddlercon' are limited to Gold
			posts[i].tag_string_general.indexOf('toddlercon') <0 && // accounts on Danbooru.
			posts[i].tag_string_general.indexOf('monochrome') <0 &&
			posts[i].tag_string_general.indexOf('greyscale')  <0   ){
				
				// If no bad tags...
					
				// Push image info to arrays
				urls.push(posts[i].large_file_url);
				ratings.push(posts[i].rating);
				source.push(posts[i].source);
				artist.push(posts[i].tag_string_artist);
					
				currentURL += 1;
				
		} else {
			// If bad tag found, do nothing or whatever...
		}
	}
	
	// Log total # of valid URLs and then postToTwitter()	
	await sleep(5000);
	console.log('\n' + urls.length + ' urls were found!');
	postToTwitter(urls, ratings, source, artist);
}


// postToTwitter()
// Read image files from local directory, upload to Twitter, and post
function postToTwitter(urls, ratings, source, artist) {
			
	// Variables
	var imageNum = 0;
			
	// Upload images to Twitter every 15 minutes
	setInterval(function(){
				
		// Cycle through local downloaded files, deleting after each upload
		if (imageNum < urls.length) {
			uploadImage(urls[imageNum], ratings[imageNum], source[imageNum], artist[imageNum]);
			imageNum = imageNum + 1;
		}
				
		// After local images are exhausted, get new posts from Danbooru
		else if (imageNum >= urls.length) {
			console.log('\nReached end of URLS. Restarting...');
			getPosts();
		}
	}, 900000);		
}


// MAIN

getPosts();
