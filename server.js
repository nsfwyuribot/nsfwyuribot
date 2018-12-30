/////////////////////////
//NSFW YURI TWITTER BOT//
/////////////////////////


// MODULES
var fs = require('fs'),
	request = require('request'),
	Danbooru = require('danbooru')
	path = require('path'),
	Twit = require('twit'),
	config = require(path.join(__dirname, 'config.js'));
	
	
// OBJECTS
const T = new Twit(config);
const booru = new Danbooru();
	
	
// FUNCTIONS

// sleep()
// Use in async functions to wait for time specified in ms
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}


// downloadImage()
// Downloads images using URLs colletected in getPosts() function
function downloadImage(uri, filename, callback) {
	
	request.head(uri, function(err, res, body){
		console.log('content-type:', res.headers['content-type']);
		console.log('content-length:', res.headers['content-length']);

		request(uri).pipe(fs.createWriteStream('R:/Program Files/nodejs/images/' + filename)).on('close', callback);
	});
};


// uploadImage()
// Uploads image to Twitter and posts
function uploadImage(imageNum, ratings, source, artist) {
	
  console.log('\nOpening image...');
  
  // Get image path in local directory
  var image_path = path.join(__dirname, '/images/yuri' + imageNum.toString() + '.png'),
      b64content = fs.readFileSync(image_path, { encoding: 'base64' });

  console.log('Uploading image...');

  // Upload image to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
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
		tweet_tags = '#yuri #sfw #sexy';
	} else {
		tweet_tags = '#yuri #nsfw #sexy';
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
          }
          else{
            console.log('Posted image successfully!');
          }
        }
      );
    }
  });
}


// getPosts()
// Stores a collection of post urls from Danbooru into an array based on specific tags
async function getPosts() {
	
	// Variables
	var posts = await booru.posts({tags: 'yuri -futa', limit: 100, page: 1});
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
			posts[i].tag_string_general.indexOf('1boy')       <0 && 
			posts[i].tag_string_general.indexOf('multiple_boys') <0 &&			
			posts[i].tag_string_general.indexOf('comic')      <0 &&
			posts[i].tag_string_general.indexOf('futanari')   <0 &&
			posts[i].tag_string_general.indexOf('loli')       <0 && // 'loli' and 'toddlercon' are limited to Gold
			posts[i].tag_string_general.indexOf('toddlercon') <0 && // accounts on Danbooru.
			posts[i].tag_string_general.indexOf('monochrome') <0 &&
			posts[i].tag_string_general.indexOf('greyscale')  <0   ){
				
				// If no bad tags...
				// Push url to array
				urls.push(booru.url(posts[i].large_file_url));
				ratings.push(posts[i].rating);
				source.push(posts[i].source);
				artist.push(posts[i].tag_string_artist);
				
				// Download image
				downloadImage(urls[currentURL].href, 'yuri' + currentURL + '.png', function(){console.log('done');});
				currentURL += 1;
				
		} else {
			// If bad tag found, do nothing or whatever...
		}
	}
	
	// Log total # of valid URLs and then postToTwitter()
	console.log('\n' + urls.length + ' urls were found!');	
	await sleep(3000);
	postToTwitter(ratings, source, artist);
}


// postToTwitter()
// Read image files from local directory, upload to Twitter, and post
function postToTwitter(ratings, source, artist) {
	
	// Read image files from local directory
	fs.readdir(__dirname + '/images', function(err, files) {
	
		if (err){
			console.log(err);
		} else {
			
			// Variables
			var images = [];  // Array to store images
			var imageNum = 0; // Keeps track of which image we're on
			
			// Push file names to images array
			files.forEach(function(f) {
				images.push(f);
			});		

			// Upload images to Twitter every 15 minutes
			setInterval(function(){
				
				// Cycle through local downloaded files, deleting after each upload
				if (imageNum < images.length) {
					console.log(imageNum);
					uploadImage(imageNum, ratings[imageNum], source[imageNum], artist[imageNum]);
					imageNum = imageNum + 1;
				}
				
				// After local images are exhausted, get new posts from Danbooru
				else if (imageNum >= images.length) {
					console.log(imageNum);
					getPosts();
				}
			}, 20000);	
		}
	});
}


// MAIN

getPosts();