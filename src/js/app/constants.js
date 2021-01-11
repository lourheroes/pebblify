var Feature = require('platform/feature');

// Pebble
var PEBBLE_REDIRECT_URI = 'pebblejs://close';
const PEBBLE_ACTIONS = {
  UP: 'up',
  SELECT: 'select',
  DOWN: 'down',
};

// Spotify
var CLIENT_ID = '';

var SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
];

const ACCOUNTS_BASE_URL = 'https://accounts.spotify.com';
const API_BASE_URL = 'https://api.spotify.com/v1';

const API_PATHS = {
  TOKEN: '/api/token',
  PLAYER: '/me/player',
  CURRENTLY_PLAYING: '/me/player/currently-playing',
  RECENTLY_PLAYED: '/me/player/recently-played',
  DEVICES: '/me/player/devices',
  PLAYLISTS: '/me/playlists',
};

// Pebblify
const APP_NAME = 'Pebblify';
const SPOTIFY_GREEN = Feature.color('jaeger-green', 'black');
const SPOTIFY_BLUE = Feature.color('blue-moon', 'black');
const COLOR_BLACK = 'black';
const COLOR_WHITE = 'white';

const NOW_PLAYING_REFRESH_SECONDS = 4;

const APP_MESSAGES = {
  NO_ACTIVE_SESSION: 'No active session found 😴',
};

module.exports = {
  PEBBLE_REDIRECT_URI,
  PEBBLE_ACTIONS,
  CLIENT_ID,
  SCOPES,
  ACCOUNTS_BASE_URL,
  API_BASE_URL,
  API_PATHS,
  SPOTIFY_GREEN,
  COLOR_BLACK,
  COLOR_WHITE,
  NOW_PLAYING_REFRESH_SECONDS,
  APP_MESSAGES,
};
