const {Builder} = require('selenium-webdriver');
const selenium = require('selenium-webdriver');
const db = require('better-sqlite3')('instatay.db');

const Instagram = require('./app/instagram');
const Reddit = require('./app/reddit');
const config = require('./config.json');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildDriver(headless = true) {
  const capabilities = selenium.Capabilities.chrome();
  if (headless) {
    var options = {
      'args': ['--disable-notifications', '--headless'],
    };
  } else {
    var options = {
      'args': ['--disable-notifications'],
    };
  }

  capabilities.set('chromeOptions', options);
  return new Builder().forBrowser('chrome').withCapabilities(capabilities).build();
}

async function getAlreadyPosted() {
  const postUris = [];

  const stmt = db.prepare('SELECT `postUri` FROM `instagramPosts` WHERE `posted` = 1');
  const results = stmt.all();

  for (let i = 0; i < results.length; i++) {
    postUris.push(results[i].postUri);
  }

  return postUris;
}

async function getUnposted() {
  const postUris = [];

  const stmt = db.prepare('SELECT `postUri` FROM `instagramPosts` WHERE `posted` = 0');
  const results = stmt.all();

  for (let i = 0; i < results.length; i++) {
    postUris.push(results[i].postUri);
  }

  return postUris;
}

async function logPost(postUri) {
  const unposted = await getUnposted();
  if (unposted.includes(postUri)) {
    const stmt = db.prepare('UPDATE `instagramPosts` SET `posted` = 1 WHERE `postUri` = ?');
    const info = stmt.run(postUri);
    if (info.changes === 1) return console.log(`Successfully updated log.`);
  } else {
    const stmt = db.prepare('INSERT INTO `instagramPosts` (`postUri`, `posted`) VALUES (?, ?)');
    const info = stmt.run(postUri, 1);
    if (info.changes === 1) return console.log(`Successfully logged post.`);
  }
}


async function start() {
  const instagram = new Instagram(config.instagram);
  const reddit = new Reddit(config.reddit);

  let driver = await buildDriver();
  const currentPosts = await getAlreadyPosted();
  const postUris = await instagram.getPostRepresentations(driver, currentPosts);

  if (postUris.length < 1) {
    console.log('No new posts found. Pausing for 15 seconds and re-checking.');

    driver.quit();
    await sleep(15000);
    await start();
  }

  instagram.downloadImages(postUris);

  await driver.quit();
  driver = await buildDriver(false);
  await reddit.login(driver);

  for (let i = 0; i < postUris.length; i++) {
    if (!postUris[i].filePath) {
      await logPost(postUris[i].postUri);
      continue;
    }

    await reddit.post(driver, postUris[i].filePath, postUris[i].title);
    await logPost(postUris[i].postUri);
  }

  await driver.quit();
  await start();
}

start()
;
