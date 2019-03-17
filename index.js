const { Builder, By, until } = require('selenium-webdriver')
const selenium = require('selenium-webdriver')
const fs = require('fs')
const request = require('request')
const db = require('better-sqlite3')('instatay.db')
const emojiRegex = require('emoji-regex')

async function start () {
  let driver = await getDriver()
  let postUri = await getPostUri(driver)
  let imageUri = await getImageUri(driver)
  let filePath = await getFilePath(imageUri)
  await downloadImage(imageUri, filePath)
  let title = await getTitle(driver)
  await loginReddit(driver)
  await postToReddit(driver, filePath, title)
  await logPost(postUri, imageUri, filePath)
  driver.quit()
  console.timeEnd('total')
  start()
}

async function getDriver () {
  let capabilities = selenium.Capabilities.chrome()
  var options = {
    'args': ['--disable-notifications']
  }
  capabilities.set('chromeOptions', options)
  return new Builder().forBrowser('chrome').withCapabilities(capabilities).build()
}

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getPostUri (driver) {
  console.time('getPostUri')
  // Go to the Instagram page.
  await driver.get('https://www.instagram.com/taylorswift/')

  // Get the most recent thumbnail.
  let thumbnail = await driver.findElement(By.xpath('//*[@id="react-root"]/section/main/div/div[3]/article/div[1]/div/div[1]/div[1]/a'))
  let href = await thumbnail.getAttribute('href')
  console.log(`Successfully got postUri: ${href}`)
  let postable = await isPostable(href)
  console.timeEnd('getPostUri')
  if (!postable) {
    console.log('Most recent image has already been posted. Pausing for 15 seconds...')
    await sleep(15000)
    await getPostUri(driver)
  }
  return href
}

async function getImageUri (driver) {
  console.time('total')
  console.time('getImageUri')
  // If it is a new post, we want to grab the image uri.
  await driver.findElement(By.xpath('//*[@id="react-root"]/section/main/div/div[3]/article/div[1]/div/div[1]/div[1]/a')).click()
  await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div[2]/div/article/div[1]/div/div/div[1]/div[1]/img')))
  let image = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div/article/div[1]/div/div/div[1]/div[1]/img'))
  let src = await image.getAttribute('src')
  console.log(`Successfully got imageUri: ${src}`)
  console.timeEnd('getImageUri')
  return src
}

async function getTitle (driver) {
  console.time('getTitle')
  let description = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div/article/div[2]/div[1]/ul/li/div/div/div/span'))
  await driver.wait(until.elementIsVisible(description, 1000))
  description = await description.getText()
  description = await cleanDescription(description)

  if (description.length <= 140) {
    console.log(`Successfully got title: ${description}`)
    console.timeEnd('getTitle')
    return `"${description}"`
  }

  let genericTitle = await getGeneralizedTitle()
  console.log(`Successfully got title: ${genericTitle}`)
  console.timeEnd('getTitle')
  return genericTitle.text
}

async function cleanDescription (description) {
  const emojis = emojiRegex()
  description = description.replace(emojis, ' ')
  // Remove new line characters with one space.
  description = description.replace(/\n/g, ' ')
  // Remove double+ spaces with a single space.
  description = description.replace(/ {1,}/g, ' ')
  description = description.trim()

  // Get the last letter and if it is a punctuation we do not want to do anything to it.
  let lastLetter = description[description.length - 1]
  if (lastLetter === '.' || lastLetter === '!' || lastLetter === '?') return description

  // Remove all trailing mentions from the end of a description.
  let repeat = true
  while (repeat) {
    let lastWord = description.substring(description.lastIndexOf(' ') + 1)
    if (lastWord.includes('@')) {
      description = description.substring(0, description.lastIndexOf(' '))
    } else {
      repeat = false
    }
  }

  description = description.trim()
  lastLetter = description[description.length - 1]
  if (lastLetter === ':') {
    description = description.substring(0, description.length - 1)
    description = description.trim()
  }

  return description
}

async function getGeneralizedTitle () {
  const stmt = db.prepare('SELECT `text` FROM `titles` ORDER BY RANDOM() LIMIT 1')
  return stmt.get()
}

async function isPostable (postUri) {
  const lastPost = await getLastPost()
  if (lastPost === null || lastPost === undefined) return true
  return postUri !== lastPost.postUri
}

async function getLastPost () {
  const stmt = db.prepare('SELECT `id`, `postUri`, `imageUri`, `filePath`, `posted` FROM `posts` WHERE `id` = (SELECT MAX(`id`) FROM `posts`)')
  return stmt.get()
}

async function getFilePath (imageUri) {
  console.time('getFilePath')
  let extension = (imageUri.includes('.png')) ? '.png' : '.jpg'
  let filePath = `${__dirname}\\images\\${Date.now()}${extension}`
  console.log(`Successfully got filePath: ${filePath}`)
  console.timeEnd('getFilePath')
  return filePath
}

async function downloadImage (imageUri, filepath) {
  console.time('downloadImage')
  request.head(imageUri, function (err, res, body) {
    if (err) console.error(err.message)
    request(imageUri).pipe(fs.createWriteStream(filepath))
  })
  console.timeEnd('downloadImage')
}

async function loginReddit (driver) {
  console.time('loginReddit')
  await driver.get('https://www.reddit.com/login/')
  await driver.findElement(By.xpath('//*[@id="loginUsername"]')).sendKeys('numptea')
  await driver.findElement(By.xpath('//*[@id="loginPassword"]')).sendKeys("U*qr$Hs)a'dC.UI12c9'")
  await driver.findElement(By.xpath('/html/body/div[1]/div/div[2]/div/form/fieldset[5]/button')).click()
  let loginStatus = driver.findElement(By.xpath('/html/body/div/div/div[2]/div/form/fieldset[5]/div/span'))
  await driver.wait(until.elementTextIs(loginStatus, 'You are now logged in. You will soon be redirected'))
  console.log(`Successfully logged in to Reddit.`)
  console.timeEnd('loginReddit')
}

async function postToReddit (driver, filepath, title) {
  console.time('postToReddit')
  await driver.get('https://www.reddit.com/r/TaylorSwift/submit')
  // Click the image option.
  await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[1]/div/button[2]')).click()
  // Set the title text.
  await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[2]/div[1]/textarea')).sendKeys(title)
  await driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[2]/div[2]/div/div/input')).sendKeys(filepath)
  let postButton = driver.findElement(By.xpath('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div[2]/div/div/div/div[2]/div[3]/div[1]/div/div[3]/div[3]/div[2]/div/div[1]/button'))
  await driver.wait(until.elementIsEnabled(postButton))
  await postButton.click()
  console.log(`Successfully posted to Reddit.`)
  console.timeEnd('postToReddit')
}

async function logPost (postUri, imageUri, filePath) {
  const stmt = db.prepare('INSERT INTO `posts` (`postUri`, `imageUri`, `filePath`, `posted`) VALUES (?, ?, ?, ?)')
  const info = stmt.run(postUri, imageUri, filePath, 1)
  if (info.changes === 1) return console.log(`Successfully logged post.`)
}

start()
