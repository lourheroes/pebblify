var UI = require('pebblejs/ui');
var Feature = require('pebblejs/platform/feature');
const { SPOTIFY_GREEN, COLOR_BLACK, COLOR_WHITE } = require('./constants');

class PebblifyCard extends UI.Card {
  constructor() {
    super({
      status: {
        color: COLOR_BLACK,
        backgroundColor: SPOTIFY_GREEN,
        separator: Feature.round('none', 'dotted'),
      },
      backgroundColor: SPOTIFY_GREEN,
    });
  }
}

class PebblifyMenu extends UI.Menu {
  constructor() {
    super({
      status: {
        color: COLOR_BLACK,
        backgroundColor: SPOTIFY_GREEN,
        separator: Feature.round('none', 'dotted'),
      },
      backgroundColor: COLOR_BLACK,
      textColor: COLOR_WHITE,
      highlightBackgroundColor: SPOTIFY_GREEN,
    });
  }
}
module.exports = { PebblifyCard, PebblifyMenu };
