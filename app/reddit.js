const {By, until} = require('selenium-webdriver');
const config = require('../config.json');

module.exports = class Reddit {
  /**
   * @param {Json} options Json representation of the model.
   */
  constructor(options = {}) {
    if (config.debug) {
      options.subredditPostLink = 'https://www.reddit.com/r/nerdsagainstbullying/submit';
    }
    Object.assign(this, options);
  }

  /**
   * Logs into Reddit.
   * @param {WebDriver} driver Selenium web driver.
   */
  async login(driver) {
    if (config.verboseLogging) {
      console.time(`Reddit.login()'`);
    }

    await driver.get('https://www.reddit.com/login/');
    await driver.findElement(By.xpath('//*[@id="loginUsername"]')).sendKeys(this.username);
    await driver.findElement(By.xpath('//*[@id="loginPassword"]')).sendKeys(this.password);
    await driver.findElement(By.xpath('/html/body/div[1]/div/div[2]/div/form/fieldset[5]/button')).click();
    const loginStatus = driver.findElement(By.xpath('/html/body/div/div/div[2]/div/form/fieldset[5]/div/span'));
    await driver.wait(until.elementTextIs(loginStatus, 'You are now logged in. You will soon be redirected'));

    if (config.verboseLogging) {
      console.timeEnd(`Reddit.login()'`);
    }
  }

  /**
   * Posts to Reddit.
   * @param {WebDriver} driver Selenium web driver.
   * @param {Post} post The Instagram post.
   */
  async post(driver, post) {
    if (config.verboseLogging) {
      console.time(`Reddit.post()'`);
    }

    await driver.get(this.subredditPostLink);
    // 30 second delay to allow the image/video to download fully.
    if (!config.debug) await sleep(30000);

    await driver.findElement(By.css('input#image')).sendKeys(post.filePath);
    await driver.findElement(By.css('textarea.title')).sendKeys(post.title);

    const postButton = driver.findElement(By.xpath('//*[@id="newlink"]/div[4]/button'));
    await driver.wait(until.elementIsEnabled(postButton));

    // 30 second delay to allow the image/video to upload fully.
    await sleep(30000);
    if (!config.debug) {
      await postButton.click();
      await driver.wait(until.titleContains(post.title));
      if (config.verboseLogging) {
        console.timeEnd(`Reddit.post()'`);
      }
      await this.postLink(driver, post);
    }
  }

  /**
   * Posts a link back to the Instagram post.
   * @param {WebDriver} driver Selenium web driver.
   * @param {Post} post The Instagram post.
   */
  async postLink(driver, post) {
    if (config.verboseLogging) {
      console.time(`Reddit.postLink()'`);
    }

    const comment = await getComment(post.postUri);

    const random = Math.floor((Math.random() * 15000) + 15000);
    const randInSeconds = Math.floor(random / 1000);

    const date = new Date();
    const cleanedDate = cleanDate(date);
    console.log(`${cleanedDate} Waiting for ${randInSeconds} seconds before commenting with "${comment}".`);
    await sleep(random);

    await driver.findElement(By.css('textarea')).sendKeys(comment);
    await driver.findElement(By.css('button.save')).click();
    await sleep(5000);

    if (config.verboseLogging) {
      console.timeEnd(`Reddit.postLink()'`);
    }
  }
};

/**
 * Gets the comment text for the post.
 * @param {String} postUri The URI of the Instagram post.
 * @return {String} The comment text.
 */
async function getComment(postUri) {
  const options = [
    `Post Link: ${postUri}`,
    `Post link: ${postUri}`,
    `post link: ${postUri}`,
    `Source: ${postUri}`,
    `source: ${postUri}`,
    `Sauce: ${postUri}`,
    `sauce: ${postUri}`,
    `Link: ${postUri}`,
    `link: ${postUri}`,
    `Taylor's Post: ${postUri}`,
    `Taylor's post: ${postUri}`,
    `Insta: ${postUri}`,
    `insta: ${postUri}`,
    `Instagram: ${postUri}`,
    `instagram: ${postUri}`,
  ];
  const random = Math.floor((Math.random() * options.length));
  return options[random];
}

/**
 * Sleeps the application for a specified length of time.
 * @param {Int} ms Length of time in milliseconds.
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
