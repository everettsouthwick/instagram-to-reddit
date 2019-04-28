const config = require('../../config.json');

module.exports = class Post {
  /**
   * @param {String} postUri The URI of an Instagram post.
   * @param {Array} imageUris An array of URIs of images associated with an Instagram post.
   * @param {String} title The title of the post.
   * @param {Date} dateTime The time of the post.
   * @param {Bool} isVideo Whether this is a video or not.
   */
  constructor(postUri, imageUris, title, dateTime, isVideo) {
    this.postUri = postUri;
    this.imageUris = imageUris;
    this.title = title;
    this.dateTime = dateTime;
    this.isVideo = isVideo;
    this.isMultiple = imageUris.length > 1 ? true : false;
    this.isPostable = calculatePostable(this);
    this.filePath = '';
  }
};

/**
 * Calculate if the post should be posted to Reddit.
 * @param {Post} post The post representation.
 * @return {Boolean} Whether the post should be posted or not.
 */
function calculatePostable(post) {
  if (config.debug) return true;

  const now = new Date();

  let diff = (now.getTime() - post.dateTime.getTime()) / 1000;
  diff = Math.abs(Math.round(diff));

  const date = new Date();
  const cleanedDate = cleanDate(date);
  console.log(`${cleanedDate} - Post was ${diff} seconds ago.`);

  if (post.imageUris.length === 0) {
    console.log(`${cleanedDate} - Post did not have any valid images.`);
    return false;
  }

  if (post.title.length === 0) {
    console.log(`${cleanedDate} - Post did not have any valid title.`);
    return false;
  }

  if (diff > 180) {
    console.log(`${cleanedDate} - Post is older than 3 minutes.`);
    return false;
  }

  if (now.getHours() <= config.upperTimeLimit && now.getHours() >= config.lowerTimeLimit) {
    console.log(`${cleanedDate} - Post was outside of active hours.`);
  }

  if (!post.isVideo) {
    const random = Math.floor((Math.random() * 3) + 1);
    if (random === 3) {
      console.log(`${cleanedDate} - Post was randomly selected to not be posted.`);
      return false;
    }
  }

  return true;
}

/**
 * Cleans the specified date object.
 * @param {Date} date The current object.
 * @return {String} A clean date representation of the time.
 */
function cleanDate(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  (hours < 10) ? hours = '0' + hours : hours;
  (minutes < 10) ? minutes = '0' + minutes : minutes;
  (seconds < 10) ? seconds = '0' + seconds : seconds;

  return `${hours}:${minutes}:${seconds}`;
}
