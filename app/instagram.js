const {Builder, By, until} = require('selenium-webdriver');
const Post = require('./models/post');
const request = require('request');
const fs = require('fs');
const emojiRegex = require('emoji-regex');

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
    const postUris = [];

    await driver.get(accountUri);
    await sleep(1000);

    const allPostUris = await driver.findElements(By.css('a'));

    for (let i = 0; i < allPostUris.length; i++) {
      const href = await allPostUris[i].getAttribute('href');
      if (href.startsWith('https://www.instagram.com/p/')) {
        postUris.push(href);
      }
    }

    return postUris;
  }

  // async getAllImageUris(driver) {
  //   let imageUris = []

  //   let allImageUris = await driver.findElements(By.className('FFVAD'))

  //   for (let i = 0; i < allImageUris.length; i++) {
  //     let src = await allImageUris[i].getAttribute('src')
  //     imageUris.push(src)
  //   }

  //   return imageUris
  // }

  /**
   * Gets all images associated with an Instagram post.
   * @param {WebDriver} driver Selenium web driver.
   * @param {String} postUri The URI of the Instagram post to get images from.
   * @return {Array} List of all image URIs.
   */
  async getImageUris(driver, postUri) {
    const imageUris = [];

    await driver.get(postUri);

    const allImageUris = await driver.findElements(By.className('FFVAD'));

    for (let i = 0; i < allImageUris.length; i++) {
      const src = await allImageUris[i].getAttribute('src');
      imageUris.push(src);
    }

    return imageUris;
  }

  /**
   * @param {WebDriver} driver Selenium web driver.
   * @param {Array} currentPosts An array of the Instagram posts that have already been posted to Reddit.
   */
  async getPostRepresentations(driver, currentPosts) {
    const posts = [];
    const postUris = await this.getAllPostUris(driver, this.accountUri);

    for (let i = 0; i < postUris.length; i++) {
      if (currentPosts.includes(postUris[i])) continue;

      const imageUris = await this.getImageUris(driver, postUris[i]);
      const post = new Post(postUris[i], imageUris, imageUris.length > 1 ? true : false);
      const title = await this.getTitle(driver);
      post.title = title;
      posts.push(post);
    }

    return posts;
  }

  /**
   * @param {WebDriver} driver Selenium web driver.
   */
  async getTitle(driver) {
    let description = await driver.getTitle();
    description = await cleanDescription(description);

    if (description.length <= 120 && description.length > 0) {
      console.log(`Successfully got title: ${description}`);
      return `"${description}"`;
    }

    const genericTitle = await getGenericTitle();
    console.log(`Successfully got title: ${genericTitle}`);
    return genericTitle;
  }

  /**
   * @param {Array} posts An array of Instagram posts.
   */
  async downloadImages(posts) {
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].imageUris.length < 1) continue;

      const filePath = await getFilePath(posts[i].imageUris[0]);
      await this.downloadImage(posts[i].imageUris[0], filePath);
      posts[i].filePath = filePath;
    }
  }

  /**
   * @param {String} imageUri The URI of the image.
   * @param {String} filePath The file path the image will be downloaded to.
   * 
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
  const extension = (imageUri.includes('.png')) ? '.png' : '.jpg';
  const filePath = `${__dirname}/images/${Date.now()}_${random}${extension}`;
  return filePath;
}
/**
 * @param {String} description The description of the post.
 */
async function cleanDescription(description) {
  description = description.substring(description.indexOf(':') + 2, description.length);
  description = description.replace('“', '');
  description = description.replace('”', '');

  const emojis = emojiRegex();
  description = description.replace(emojis, ' ');
  // Remove new line characters with one space.
  description = description.replace(/\n/g, ' ');
  // Remove double+ spaces with a single space.
  description = description.replace(/ {1,}/g, ' ');
  description = description.trim();

  // Get the last letter and if it is a punctuation we do not want to do anything to it.
  let lastLetter = description[description.length - 1];
  if (lastLetter === '.' || lastLetter === '!' || lastLetter === '?') return description;

  // Remove all trailing mentions from the end of a description.
  let repeat = true;
  while (repeat) {
    const lastWord = description.substring(description.lastIndexOf(' ') + 1);
    if (lastWord.includes('@')) {
      description = description.substring(0, description.lastIndexOf(' '));
    } else {
      repeat = false;
    }
  }

  description = description.trim();
  lastLetter = description[description.length - 1];
  if (lastLetter === ':') {
    description = description.substring(0, description.length - 1);
    description = description.trim();
  }

  return description;
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
