const {By, until} = require('selenium-webdriver');
const config = require('../config.json');

module.exports = class Reddit {
  /**
   * @param {Json} options Json representation of the model.
   */
  constructor(options = {}) {
    if (options.debug) {
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
    // Set the title text.
    await driver.findElement(By.css('input#image')).sendKeys(post.filePath);
    await driver.findElement(By.css('textarea.title')).sendKeys(post.title);

    const postButton = driver.findElement(By.xpath('//*[@id="newlink"]/div[4]/button'));
    await driver.wait(until.elementIsEnabled(postButton));

    // if (this.debug) {
    //   await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[3]/div[2]/div/div[2]/button')).click();
    //   await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[4]/div/div/section/footer/button[1]')).click();
    // } else {
    //   await postButton.click();
    // }

    await postButton.click();
    await driver.wait(until.titleContains(post.title));

    if (config.verboseLogging) {
      console.timeEnd(`Reddit.post()'`);
    }

    await this.postLink(driver, post);
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

    const comment = getComment(post.postUri);
    const random = Math.floor((Math.random() * 20000) + 10000);
    await sleep(random);

    await driver.findElement(By.css('textarea')).sendKeys(comment);
    await driver.findElement(By.css('button.save')).click();
    await sleep(2500);

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
    `Source: ${postUri}`,
    `Sauce: ${postUri}`,
    `Link: ${postUri}`,
    `Link to Post: ${postUri}`,
    `Taylor's Post: ${postUri}`,
    `[Instagram Post](${postUri})`,
    `[Source](${postUri})`,
    `[Sauce](${postUri})`,
    `[Taylor's Post](${postUri})`,
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
