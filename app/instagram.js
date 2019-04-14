const {By} = require('selenium-webdriver');
const Post = require('./models/post');
const request = require('request');
const fs = require('fs');
const emojiRegex = require('emoji-regex');
const config = require('../config.json');

module.exports = class Instagram {
  /**
   * @param {Json} options Json representation of the model.
   */
  constructor(options = {}) {
    Object.assign(this, options);
  }

  /**
   * Gets all posts for an Instagram account.
   * @param {WebDriver} driver Selenium web driver.
   * @param {String} accountUri The URI of the Instagram account to get posts from.
   * @return {Array} List of all post URIs.
   */
  async getAllPostUris(driver, accountUri) {
    if (config.verboseLogging) {
      console.time(`Instagram.getAllPostUris()'`);
    }

    const postUris = [];

    await driver.get(accountUri);
    await sleep(250);

    const allPostUris = await driver.findElements(By.css('a'));

    for (let i = 0; i < allPostUris.length; i++) {
      const href = await allPostUris[i].getAttribute('href');
      if (href.startsWith('https://www.instagram.com/p/')) {
        postUris.push(href);
      }
    }

    if (config.verboseLogging) {
      console.debug(`Instagram.getAllPostUris(): postUris.length - ${postUris.length}`);
      console.timeEnd(`Instagram.getAllPostUris()'`);
    }

    return postUris;
  }

  /**
   * Gets all images associated with an Instagram post.
   * @param {WebDriver} driver Selenium web driver.
   * @param {String} postUri The URI of the Instagram post to get images from.
   * @return {Array} List of all image URIs.
   */
  async getImageUris(driver, postUri) {
    if (config.verboseLogging) {
      console.time(`Instagram.getImageUris()'`);
    }

    const imageUris = [];

    await driver.get(postUri);

    const allImageUris = await driver.findElements(By.className('FFVAD'));

    for (let i = 0; i < allImageUris.length; i++) {
      const src = await allImageUris[i].getAttribute('src');
      imageUris.push(src);
    }

    if (config.verboseLogging) {
      console.debug(`Instagram.getImageUris(): imageUris.length - ${imageUris.length}`);
      console.timeEnd(`Instagram.getImageUris()'`);
    }

    return imageUris;
  }

  /**
   * Gets all videos associated with an Instagram post.
   * @param {WebDriver} driver Selenium web driver.
   * @return {Array} List of all video URIs.
   */
  async getVideoUris(driver) {
    const videoUris = [];

    const allVideoUris = await driver.findElements(By.css('video.tWeCl'));

    for (let i = 0; i < allVideoUris.length; i++) {
      const src = await allVideoUris[i].getAttribute('src');
      videoUris.push(src);
    }

    return videoUris;
  }

  /**
   * @param {WebDriver} driver Selenium web driver.
   * @param {Array} currentPosts An array of the Instagram posts that have already been posted to Reddit.
   */
  async getPostRepresentations(driver, currentPosts) {
    if (config.verboseLogging) {
      console.time(`Instagram.getPostRepresentations()'`);
    }

    const posts = [];
    const postUris = await this.getAllPostUris(driver, this.accountUri);

    for (let i = 0; i < postUris.length; i++) {
      if (currentPosts.includes(postUris[i])) continue;

      const imageUris = await this.getImageUris(driver, postUris[i]);

      let post = undefined;

      if (imageUris.length < 1) {
        const videoUris = await this.getVideoUris(driver, postUris[i]);
        post = new Post(postUris[i], videoUris, videoUris.length > 1 ? true : false);
        const title = await this.getTitle(driver);
        post.title = title;
      } else {
        post = new Post(postUris[i], imageUris, imageUris.length > 1 ? true : false);
        const title = await this.getTitle(driver);
        post.title = title;
      }

      posts.push(post);
    }

    if (config.verboseLogging) {
      console.debug(`Instagram.getPostRepresentations(): posts.length - ${posts.length}`);
      console.timeEnd(`Instagram.getPostRepresentations()'`);
    }

    return posts;
  }

  /**
   * @param {WebDriver} driver Selenium web driver.
   */
  async getTitle(driver) {
    if (config.verboseLogging) {
      console.time(`Instagram.getTitle()'`);
    }

    let title = await driver.getTitle();
    title = await cleanTitle(title);

    if (title.length <= 120 && title.length >= 3) {
      title = `"${title}"`;
    } else {
      title = await getGenericTitle();
    }

    if (config.verboseLogging) {
      console.debug(`Instagram.getTitle(): title - ${title}`);
      console.timeEnd(`Instagram.getTitle()'`);
    }

    return title;
  }

  /**
   * @param {Array} posts An array of Instagram posts.
   */
  async downloadImages(posts) {
    if (config.verboseLogging) {
      console.time(`Instagram.downloadImages()'`);
    }

    for (let i = 0; i < posts.length; i++) {
      if (posts[i].imageUris.length < 1) continue;

      const filePath = await getFilePath(posts[i].imageUris[0]);
      await this.downloadImage(posts[i].imageUris[0], filePath);
      posts[i].filePath = filePath;
    }

    if (config.verboseLogging) {
      console.timeEnd(`Instagram.downloadImages()'`);
    }
  }

  /**
   * @param {String} imageUri The URI of the image.
   * @param {String} filePath The file path the image will be downloaded to.
   */
  async downloadImage(imageUri, filePath) {
    request.head(imageUri, function(err, res, body) {
      if (err) console.error(err.message);

      request(imageUri).pipe(fs.createWriteStream(filePath));
    });
  }
};

/**
 * Sleeps the application for a specified length of time.
 * @param {Int} ms Length of time in milliseconds.
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {String} imageUri The URI of the image.
 */
async function getFilePath(imageUri) {
  const random = Math.floor((Math.random() * 10000000) + 1000000);

  let extension = '.jpg';
  if (imageUri.includes('.png')) {
    extension = '.png';
  } else if (imageUri.includes('.mp4')) {
    extension = '.mp4';
  }

  const filePath = `${__dirname}/images/${Date.now()}_${random}${extension}`;
  return filePath;
}
/**
 * @param {String} title The title of the post.
 */
async function cleanTitle(title) {
  title = title.substring(title.indexOf(':') + 2, title.length);
  title = title.replace('“', '');
  title = title.replace('”', '');

  const emojis = emojiRegex();
  title = title.replace(emojis, ' ');
  // Remove new line characters with one space.
  title = title.replace(/\n/g, ' ');
  // Remove double+ spaces with a single space.
  title = title.replace(/ {1,}/g, ' ');
  title = title.trim();

  // Get the last letter and if it is a punctuation we do not want to do anything to it.
  let lastLetter = title[title.length - 1];
  if (lastLetter === '.' || lastLetter === '!' || lastLetter === '?') return title;

  // Remove all trailing mentions from the end of a title.
  let repeat = true;
  while (repeat) {
    const lastWord = title.substring(title.lastIndexOf(' ') + 1);
    if (lastWord.includes('@')) {
      title = title.substring(0, title.lastIndexOf(' '));
    } else {
      repeat = false;
    }
  }

  title = title.trim();
  lastLetter = title[title.length - 1];
  if (lastLetter === ':') {
    title = title.substring(0, title.length - 1);
    title = title.trim();
  }

  return title;
}

/**
 */
async function getGenericTitle() {
  const options = [
    'New Instagram!',
    'New Instagram Post!',
    'New Instagram from Taylor!',
    'Newest Instagram Post!',
    'Taylor\'s Instagram!',
    'Brand new Insta!',
    'New Instagram! :)',
    'New Taylor Post!',
    'Taylor\'s Newest Post!',
  ];
  const random = Math.floor((Math.random() * options.length));
  return options[random];
}
