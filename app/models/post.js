const config = require('../../config.json');

module.exports = class Post {
  /**
   * @param {String} postUri The URI of an Instagram post.
   * @param {Array} imageUris An array of URIs of images associated with an Instagram post.
   * @param {String} title The title of the post.
   * @param {Date} dateTime The time of the post.
   */
  constructor(postUri, imageUris, title, dateTime) {
    this.postUri = postUri;
    this.imageUris = imageUris;
    this.title = title;
    this.dateTime = dateTime;
    this.isMultiple = imageUris.length > 1 ? true : false;
    this.isPostable = calculatePostable(this);
    this.filePath = '';

    if (this.isMultiple) {
      this.title = `${title} [Album link in comments]`;
    }
  }
};

/**
 * Calculate if the post should be posted to Reddit.
 * @param {Post} post The post representation.
 * @return {Boolean} Whether the post should be posted or not.
 */
function calculatePostable(post) {
  let postable = false;

  const now = new Date();

  let diff = (now.getTime() - post.dateTime.getTime()) / 1000;
  diff /= 60;
  diff = Math.abs(Math.round(diff));

  if (diff < 30) {
    console.log(`Post is within the last 30 minutes. Check passed.`);
    postable = true;
  } else {
    console.log(`Post is outside of the last 30 minutes. Check failed.`);
    postable = false;
  }

  if (now.getHours() >= config.upperTimeLimit || now.getHours() <= config.lowerTimeLimit) {
    console.log(`Post is outside of the active hours. Check failed.`);
    postable = false;
  } else {
    console.log(`Post is within active hours. Check passed.`);
  }

  if (post.imageUris.length === 0) {
    console.log(`Post has no images associated with it. Check failed.`);
    postable = false;
  }

  return postable;
}
