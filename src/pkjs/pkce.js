const sha256 = require('./sha256');

class PkceHelper {
  //////////////////////////////////////////////////////////////////////
  // PKCE HELPER FUNCTIONS

  // Generate a secure random string using the browser crypto functions
  generateRandomString() {
    var array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join(
      ''
    );
  }

  // Calculate the SHA256 hash of the input text.
  // Returns a promise that resolves to an ArrayBuffer
  sha256Sync(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return sha256(data);
  }

  // Base64-urlencodes the input string
  base64urlencode(str) {
    // Convert the ArrayBuffer to string using Uint8 array to conver to what btoa accepts.
    // btoa accepts chars only within ascii 0-255 and base64 encodes them.
    // Then convert the base64 encoded to base64url encoded
    //   (replace + with -, replace / with _, trim trailing =)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Return the base64-urlencoded sha256 hash for the PKCE challenge
  pkceChallengeFromVerifier(v) {
    let hashed = this.sha256Sync(v);
    return this.base64urlencode(hashed);
  }
}

module.exports = new PkceHelper();
