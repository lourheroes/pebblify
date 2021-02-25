var Settings = require('pebblejs/settings');
const axios = require('axios');
const PkceHelper = require('./pkce');

const {
  CLIENT_ID,
  PEBBLE_REDIRECT_URI,
  SCOPES,
  ACCOUNTS_BASE_URL,
  API_BASE_URL,
} = require('./constants');

class SpotifyAuth {
  getAuthorizationUrl() {
    // Create and store a random "state" value
    let state = PkceHelper.generateRandomString();
    Settings.data('pkceState', state);

    // Create and store a new PKCE code_verifier (the plaintext random secret)
    let codeVerifier = PkceHelper.generateRandomString();
    Settings.option('pkceCodeVerifier', codeVerifier);

    // Hash and base64-urlencode the secret to use as the challenge
    let codeChallenge = PkceHelper.pkceChallengeFromVerifier(codeVerifier);

    return `${ACCOUNTS_BASE_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      PEBBLE_REDIRECT_URI
    )}&scope=${encodeURIComponent(
      SCOPES.join(' ')
    )}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=123&response_type=code`;
  }

  initSettingsPage() {
    return Settings.config(
      {
        url: this.getAuthorizationUrl(),
        autosave: false,
        hash: true,
      },
      (e) => {
        console.log('opening configurable');
      },
      (e) => {
        if (e.options.hasOwnProperty('/?code')) {
          // user accepted authorization, code received
          // using code to retrieve Spotify token
          let pkceCode = e.options['/?code'];
          this.getToken(pkceCode);
        } else if (e.options.hasOwnProperty('/?error')) {
          // user closed authorization url
          console.log('User closed Spotify authorize url');
        } else {
        }
        if (e.failed) {
          console.log('PARSING FAILED - Response:');
          console.log(e.response);
        }
      }
    );
  }

  getToken(pkceCode) {
    let body = `client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      PEBBLE_REDIRECT_URI
    )}&code_verifier=${Settings.option(
      'pkceCodeVerifier'
    )}&code=${pkceCode}&grant_type=authorization_code`;

    axios
      .post(`${ACCOUNTS_BASE_URL}/api/token`, body, {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      })
      .then((response) => {
        let userTokens = response.data;
        userTokens.expiration_date =
          new Date().getTime() + userTokens.expires_in * 1000;

        Settings.option('userTokens', userTokens);
      })
      .catch((data) => {
        if (data.error == 'invalid_grant') {
          // Authorization code expired
          console.log('User must relaunch Pebblify settings app');
        }
      });
  }

  refreshToken() {
    let currentUserTokens = Settings.option('userTokens');
    let body = `client_id=${CLIENT_ID}&refresh_token=${currentUserTokens.refresh_token}&grant_type=refresh_token`;

    axios
      .post(`${ACCOUNTS_BASE_URL}/api/token`, body, {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      })
      .then((response) => {
        let newUserTokens = response.data;
        newUserTokens.expiration_date =
          new Date().getTime() + newUserTokens.expires_in * 1000;

        Settings.option('userTokens', newUserTokens);
      })
      .catch((data) => {
        if (data.error == 'invalid_grant') {
          // Authorization code expired
          console.log('User must relaunch Pebblify settings app');
        }
        //TODO: Settings.option('userTokens', false); --> user should see beforeAuthCard
      });
  }

  /**
   * @param {boolean} callPath
   * @param {Function} success
   * @param {Function} failure
   * @param {Array} data
   * @param {String} method
   */
  makeCall(callPath, success, failure, data, method) {
    const options = {
      url: `${API_BASE_URL}${callPath}`,
      method: method ? method : 'GET',
      type: 'json',
      headers: {
        Authorization: 'Bearer ' + Settings.option('userTokens').access_token,
      },
      data: data ? data : {},
    };

    axios(options)
      .then((response) => {
        return success(response.data);
      })
      .catch((error) => {
        // check directly http request status instead of payload
        if (error.response && error.response.status == 401) {
          // access token is expired
          this.refreshToken();
        }

        // TODO: Rate limiting is status code 429
        return failure(error.response);
      });
  }
}

module.exports = SpotifyAuth;
