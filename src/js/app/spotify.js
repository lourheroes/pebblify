var ajax = require('ajax');
var Settings = require('settings');
const PkceHelper = require('pkce');

const {
  CLIENT_ID,
  PEBBLE_REDIRECT_URI,
  SCOPES,
  ACCOUNTS_BASE_URL,
  API_BASE_URL,
} = require('constants');

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

  getPebbleConfig() {
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
    let pkceCodeVerifier = Settings.option('pkceCodeVerifier');
    ajax(
      {
        url: `${ACCOUNTS_BASE_URL}/api/token?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
          PEBBLE_REDIRECT_URI
        )}&code_verifier=${pkceCodeVerifier}&code=${pkceCode}&grant_type=authorization_code`,
        method: 'post',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      },
      (data) => {
        let userTokens = JSON.parse(data);
        userTokens.expiration_date =
          new Date().getTime() + userTokens.expires_in * 1000;

        Settings.option('userTokens', userTokens);
      },
      (data) => {
        if (data?.error == 'invalid_grant') {
          // Authorization code expired
          console.log('User must relaunch Pebblify settings app');
        }
      }
    );
  }

  refreshToken() {
    let currentUserTokens = Settings.option('userTokens');

    ajax(
      {
        url: `${ACCOUNTS_BASE_URL}/api/token?client_id=${CLIENT_ID}&refresh_token=${currentUserTokens?.refresh_token}&grant_type=refresh_token`,
        method: 'post',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      },
      (data) => {
        let newUserTokens = JSON.parse(data);
        newUserTokens.expiration_date =
          new Date().getTime() + newUserTokens.expires_in * 1000;
        console.log(newUserTokens.expiration_date);

        Settings.option('userTokens', newUserTokens);
      },
      (data) => {
        console.log('API Token Error Return ?');
        console.log(JSON.stringify(data));
        if (data?.error == 'invalid_grant') {
          // Authorization code expired
          console.log('User must relaunch Pebblify settings app');
        }
        //TODO: Settings.option('userTokens', false); --> user should see beforeAuthCard
      }
    );
  }

  /**
   * @param {boolean} callPath
   * @param {Function} success
   * @param {Function} failure
   * @param {Array} data
   * @param {String} method
   */
  makeCall(callPath, success, failure, data, method) {
    return ajax(
      {
        url: `${API_BASE_URL}${callPath}`,
        type: 'json',
        method: method ? method : 'get',
        headers: {
          Authorization:
            'Bearer ' + Settings.option('userTokens')?.access_token,
        },
        data: data ? data : {},
      },
      (data) => {
        return success(data);
      },
      (data) => {
        if (data?.error?.status == 401) {
          // access token is expired
          this.refreshToken();
        }
        // TODO: Rate limiting is status code 429
        return failure(data);
      }
    );
  }
}

module.exports = SpotifyAuth;
