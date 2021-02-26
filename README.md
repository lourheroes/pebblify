# Pebblify

Pebblify is a full-featured Spotify app for Pebble watches, made with PebbleJS ⌚🎶 https://apps.rebble.io/en_US/application/5ff3b52b1e6bb11b9eee5c5a

---
## Requirements

#### SDK
You will need the Pebble SDK to run this project:
- SDK installation instruction: https://www.reddit.com/r/pebble/comments/9i9aqy/developing_for_pebble_without_cloudpebble_windows/
- or get the docker image: https://hub.docker.com/r/rebble/pebble-sdk

#### Spotify
Your will need to create an app in your Spotify developer portal

In the app settings, fill the Redirect URIs section with

    pebblejs://close
Retrieve the Client ID and fill with it the CLIENT_ID variable in _src/constant.js_

### Run the app
In the app directory run the following command
#### On your phone
    $ pebble build && pebble install --phone=x.x.x.x
#### On an emulator
    $ pebble build && pebble install --emulator=basalt
    
### See the logs
    pebble logs --phone=x.x.x.x

---
