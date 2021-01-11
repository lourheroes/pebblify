/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var Settings = require('settings');
const { PEBBLE_ACTIONS } = require('constants');
const { PebblifyCard } = require('windows');
const SpotifyAuth = require('spotify');
const main = require('main');

const spotifyAuth = new SpotifyAuth();

// set a configurable with the open callback
spotifyAuth.getPebbleConfig();

var launchUserTokens = Settings.option('userTokens');

if (!launchUserTokens) {
  // no user tokens found, user must authorize Pebblify in watchapp settings
  let beforeAuthCard = new PebblifyCard();
  beforeAuthCard.action({
    up: 'IMAGE_ICON_CHECK',
    down: 'IMAGE_ICON_DISMISS',
  });
  beforeAuthCard.body(
    'Authorize Pebblify in the watchapp settings then click up 😇'
  );
  beforeAuthCard.show();

  //
  beforeAuthCard.on('click', (event) => {
    switch (event.button) {
      case PEBBLE_ACTIONS.UP:
        // the user can access once Pebblify is authorized
        if (Settings.option('userTokens')) {
          beforeAuthCard.hide();
          main();
        }
        break;
      case PEBBLE_ACTIONS.DOWN:
        // quit the app
        beforeAuthCard.hide();
        break;
      default:
        break;
    }
  });
} else {
  main();
}
