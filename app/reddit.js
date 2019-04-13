const {Builder, By, until} = require('selenium-webdriver');

module.exports = class REddit {
  /**
   * @param {Json} options Json representation of the model.
   */
  constructor(options = {}) {
    Object.assign(this, options);
  }

  /**
   * Logs into Reddit.
   * @param {WebDriver} driver Selenium web driver.
   */
  async login(driver) {
    await driver.get('https://www.reddit.com/login/');
    await driver.findElement(By.xpath('//*[@id="loginUsername"]')).sendKeys(this.username);
    await driver.findElement(By.xpath('//*[@id="loginPassword"]')).sendKeys(this.password);
    await driver.findElement(By.xpath('/html/body/div[1]/div/div[2]/div/form/fieldset[5]/button')).click();
    const loginStatus = driver.findElement(By.xpath('/html/body/div/div/div[2]/div/form/fieldset[5]/div/span'));
    await driver.wait(until.elementTextIs(loginStatus, 'You are now logged in. You will soon be redirected'));
  }

  /**
   * Logs into Reddit.
   * @param {WebDriver} driver Selenium web driver.
   * @param {String} filePath The path to the file to upload.
   * @param {String} title Title of the Reddit post.
   */
  async post(driver, filePath, title) {
    await driver.get(this.subredditPostLink);
    // Click the image option.
    await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[1]/div/button[2]')).click();
    // Set the title text.
    await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[2]/div[1]/textarea')).sendKeys(title);
    await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[2]/div[2]/div/div/input')).sendKeys(filePath);
    const postButton = driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[3]/div[2]/div/div[1]/button'));
    await driver.wait(until.elementIsEnabled(postButton));

    if (this.debug) {
      await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[3]/div[2]/div/div[2]/button')).click();
      await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[4]/div/div/section/footer/button[1]')).click();
      await sleep(15000);
    } else {
      await postButton.click();
      await sleep(15000);
    }
  }
};

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}