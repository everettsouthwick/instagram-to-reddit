const config = require('../config.json');

module.exports = class SqlRepository {
  /**
   * @param {Json} options Json representation of the model.
   */
  constructor(options = {}) {
    Object.assign(this, options);
  }

  /**
   * Initializes the database with the necessary tables.
   */
  async init() {
    if (config.verboseLogging) {
      console.time(`SqlRepository.init()`);
    };

    this.db = require('better-sqlite3')(this.databaseName);

    const stmt = this.db.prepare(`
    CREATE TABLE IF NOT EXISTS \`instagramPosts\` ( 
      \`id\` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, 
      \`postUri\` TEXT NOT NULL UNIQUE, 
      \`posted\` NUMERIC NOT NULL 
      );
    `);
    stmt.run();
    this.db.close();

    if (config.verboseLogging) {
      console.timeEnd(`SqlRepository.init()`);
    }
  };

  /**
   * Get a list of all the stored posts that have already been posted to Reddit.
   * @return {Array} An array of all the posts that have been posted to Reddit.
   */
  async getAlreadyPosted() {
    if (config.verboseLogging) {
      console.time(`SqlRepository.getAlreadyPosted()`);
    };

    const postUris = [];

    this.db = require('better-sqlite3')(this.databaseName);
    const stmt = this.db.prepare('SELECT `postUri` FROM `instagramPosts` WHERE `posted` = 1');
    const results = stmt.all();
    this.db.close();

    for (let i = 0; i < results.length; i++) {
      postUris.push(results[i].postUri);
    }

    if (config.verboseLogging) {
      console.debug(`SqlRepository.getAlreadyPosted(): postUris.length - ${postUris.length}`);
      console.timeEnd(`SqlRepository.getAlreadyPosted()`);
    };

    return postUris;
  }

  /**
   * Get a list of all the stored posts that have not yet been posted to Reddit.
   * @return {Array} An array of all the posts that have not yet been posted to Reddit.
   */
  async getUnposted() {
    if (config.verboseLogging) {
      console.time(`SqlRepository.getUnposted()`);
    };

    const postUris = [];

    const stmt = this.db.prepare('SELECT `postUri` FROM `instagramPosts` WHERE `posted` = 0');
    const results = stmt.all();

    for (let i = 0; i < results.length; i++) {
      postUris.push(results[i].postUri);
    }

    if (config.verboseLogging) {
      console.debug(`SqlRepository.getUnposted(): postUris.length - ${postUris.length}`);
      console.timeEnd(`SqlRepository.getUnposted()`);
    };

    return postUris;
  }

  /**
   * Logs a specified post.
   * @param {String} postUri The URI of the post to log.
   */
  async logPost(postUri) {
    if (config.verboseLogging) {
      console.time(`SqlRepository.logPost()`);
    };

    this.db = require('better-sqlite3')(this.databaseName);

    const unposted = await this.getUnposted();
    if (unposted.includes(postUri)) {
      const stmt = this.db.prepare('UPDATE `instagramPosts` SET `posted` = 1 WHERE `postUri` = ?');
      const info = stmt.run(postUri);
      if (info.changes === 1) {
        console.log(`Successfully updated log for (${postUri}).`);
      }
    } else {
      const stmt = this.db.prepare('INSERT INTO `instagramPosts` (`postUri`, `posted`) VALUES (?, ?)');
      const info = stmt.run(postUri, 1);
      if (info.changes === 1) {
        const date = new Date();
        const cleanedDate = cleanDate(date);
        console.log(`${cleanedDate} - Successfully logged post for (${postUri}).`);
      }
    }

    this.db.close();

    if (config.verboseLogging) {
      console.timeEnd(`SqlRepository.logPost()`);
    };
  }
};

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
