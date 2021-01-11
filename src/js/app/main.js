var Settings = require('settings');
const { PebblifyCard, PebblifyMenu } = require('windows');

const {
  PEBBLE_ACTIONS,
  API_PATHS,
  SPOTIFY_GREEN,
  COLOR_BLACK,
  COLOR_WHITE,
  NOW_PLAYING_REFRESH_SECONDS,
  APP_MESSAGES,
} = require('constants');

const SpotifyAuth = require('spotify');

const spotifyAuth = new SpotifyAuth();

class NowPlayingCard extends PebblifyCard {
  constructor() {
    super();
    this._activeSession = false;
    this.subtitleColor(COLOR_BLACK);
    this.subtitle(APP_MESSAGES.NO_ACTIVE_SESSION);
  }

  init() {
    this.on('show', () => {
      this.autoRefresh = true;
    });

    this.on('hide', () => {
      this.autoRefresh = false;
    });

    this.on('click', (event) => {
      if (this.activeSession) {
        let playbackAction = '';
        let httpMethod = 'post';
        switch (event.button) {
          case PEBBLE_ACTIONS.UP:
            playbackAction = 'previous';
            break;
          case PEBBLE_ACTIONS.SELECT:
            httpMethod = 'put';
            playbackAction = Settings.data('isPlaying') ? 'pause' : 'play';
            break;
          case PEBBLE_ACTIONS.DOWN:
            playbackAction = 'next';
            break;
          default:
            break;
        }

        spotifyAuth.makeCall(
          `${API_PATHS.PLAYER}/${playbackAction}`,
          (data) => {
            this.refresh();
          },
          (data) => {
            console.log(JSON.stringify(data));

            if (
              data?.error?.status == 403 &&
              data?.error?.reason == 'UNKNOWN'
            ) {
              console.log('CASE REFRESH + ACTIVE SESSION');
              this.activeSession = true;
              this.refresh();
            } else if (
              data?.error?.status == 404 &&
              data?.error?.reason == 'NO_ACTIVE_DEVICE'
            ) {
              console.log('CASE NO REFRESH + NO ACTIVE SESSION');
              this.activeSession = false;
            } else {
              console.log('CASE REFRESH + ACTIVE SESSION');
              this.activeSession = true;
              this.refresh();
            }
          },
          {},
          httpMethod
        );
      }
    });
  }

  get activeSession() {
    return this._activeSession;
  }

  /**
   * @param {boolean} isActive
   */
  set activeSession(isActive) {
    if (isActive != this._activeSession) {
      this._activeSession = isActive;

      if (!isActive) {
        this.subtitle(APP_MESSAGES.NO_ACTIVE_SESSION);
        this.body('');

        this.subtitleColor(COLOR_BLACK);
        this.backgroundColor(SPOTIFY_GREEN);

        this.action(false);
      } else {
        this.action(true);
      }
    }
  }

  /**
   * @param {boolean} enabled
   */
  set autoRefresh(enabled) {
    if (enabled) {
      if (this._refreshTimer) {
        // a setInterval is already running
        clearInterval(this._refreshTimer);
      }
      this.refresh();
      let timerId = setInterval(() => {
        this.refresh();
      }, NOW_PLAYING_REFRESH_SECONDS * 1000);
      // set a new refreshTimer
      this._refreshTimer = timerId;
    } else {
      clearInterval(this._refreshTimer);
    }
  }

  refresh() {
    spotifyAuth.makeCall(
      API_PATHS.CURRENTLY_PLAYING,
      (data) => {
        this.activeSession = true;

        this.subtitleColor(COLOR_WHITE);
        this.subtitle(
          data?.item?.name.includes(' - ')
            ? data?.item?.name.split(' - ')[0]
            : data?.item?.name
        );
        this.body(data?.item?.artists.map((e) => `🎤 ${e.name}`).join('\n'));

        this.backgroundColor(SPOTIFY_GREEN);

        this.action({
          up: data?.actions?.disallows?.skipping_prev
            ? false
            : 'IMAGE_MUSIC_ICON_BACKWARD',
          select: data?.is_playing
            ? 'IMAGE_MUSIC_ICON_PAUSE'
            : 'IMAGE_MUSIC_ICON_PLAY',
          down: data?.actions?.disallows?.skipping_next
            ? false
            : 'IMAGE_MUSIC_ICON_FORWARD',
        });
        Settings.data('isPlaying', data?.is_playing);
      },
      (data) => {
        this.activeSession = false;
        // TODO: handle NO_ACTIVE_DEVICE
        /*
                if (
                    data?.error?.status == 404 &&
                    data?.error?.reason == 'NO_ACTIVE_DEVICE'
                ) {
                    this.activeSession = false;
                } else {
                    this.activeSession = false;
                }
                */
      }
    );
  }
}

class PebblifyApp {
  constructor() {
    this._nowPlayingCard = new NowPlayingCard();
  }

  get nowPlayingCard() {
    return this._nowPlayingCard;
  }
}

const main = () => {
  let userTokens = Settings.option('userTokens');

  // user has authorized the app
  let tokenHasExpired =
    new Date().getTime() > userTokens?.expiration_date - 120 * 1000;

  if (tokenHasExpired) {
    // access token is expired, request a new one using the refresh_token
    let refreshTimerId = Settings.data('refreshTimerId');
    if (refreshTimerId) {
      clearInterval(refreshTimerId); // Clear the last refreshToken setInterval
    }

    spotifyAuth.refreshToken();

    // refresh the access_token two minutes before it expires
    let newTimerId = setInterval(() => {
      spotifyAuth.refreshToken();
    }, (userTokens?.expires_in - 120) * 1000);
    Settings.data('refreshTimerId', newTimerId);
  }

  var app = new PebblifyApp();
  var mainMenu = new PebblifyMenu();

  mainMenu.sections([
    {
      title: 'Home',
      items: [
        {
          title: 'Now playing',
          icon: 'IMAGE_MUSIC_ICON_PLAY',
        },
        {
          title: 'Jump back in',
        },
        {
          title: 'Made for you',
        },
      ],
    },
    {
      title: 'Library',
      items: [
        {
          title: 'Playlists',
        },
        {
          title: 'Albums',
        },
        {
          title: 'Artists',
        },
      ],
    },
    {
      title: 'Devices',
      items: [
        {
          title: 'Play on device',
        },
      ],
    },
  ]);

  mainMenu.show();
  app.nowPlayingCard.init();

  mainMenu.on('select', (e) => {
    switch (e.sectionIndex) {
      case 0:
        switch (e.itemIndex) {
          case 0:
            app.nowPlayingCard.show();
            break;
          default:
            break;
        }
        break;
      case 1:
        switch (e.itemIndex) {
          case 0:
            let playlistsMenu = new PebblifyMenu();
            playlistsMenu.status(false);

            playlistsMenu.on('select', (e) => {
              console.log(
                'Selected item #' +
                  e.itemIndex +
                  ' of section #' +
                  e.sectionIndex
              );
              console.log('The item is titled "' + e.item.title + '"');
            });
            playlistsMenu.show();

            let playlistSuccess = (data) => {
              data.items.map((x) => {
                x.title = x.name;
                x.subtitle = `${x.tracks.total} tracks`;
              });
              playlistsMenu.items(0, data.items);
            };

            let playlistFailure = (data) => {
              console.log('playlistFailure');
            };

            spotifyAuth.makeCall(
              API_PATHS.PLAYLISTS,
              playlistSuccess,
              playlistFailure
            );
            break;
          default:
            break;
        }
        break;
      case 2:
        break;
      default:
        break;
    }
  });
};

module.exports = main;
