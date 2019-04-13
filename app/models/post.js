module.exports = class Post {
  /**
   * @param {String} postUri The URI of an Instagram post.
   * @param {Array} imageUris An array of URIs of images associated with an Instagram post.
   * @param {Boolean} isMultiple Indicates whether it is a multiple post or not.
   */
  constructor(postUri, imageUris, isMultiple) {
    this.postUri = postUri;
    this.imageUris = imageUris;
    this.isMultiple = isMultiple;
  }
};
