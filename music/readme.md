# Modular Discord Bot 
## Music module

Module that lets you play music.

### Installation

**This module may not be perfect and may have some issues, same goes with code quality.**

This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module **requires** other modules to work, scroll down to get the list.
This module **requires** changes to config.js.

```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
3. npm install miniget
```

Modify config.js
```js
module.exports = {
   ...
    music: {
        "textChannel": "PUT_CHANNEL_ID_HERE", //text channel the music bot will work in
    }
    ...
}
```

### Required modules

This module requires these extra modules to work

| Plugin | Link |
| ------ | ------ |
| YouTube Module | https://github.com/eskejpo/discord-bot-modules/tree/master/youtube |
| Music Queue Module | https://github.com/eskejpo/discord-bot-modules/tree/master/musicqueue |
| Permissions Module | https://github.com/eskejpo/discord-bot-modules/tree/master/permissions |
| Request Module | https://github.com/eskejpo/discord-bot-modules/tree/master/request |
| Server exclusive memory Module | https://github.com/eskejpo/discord-bot-modules/tree/master/memory |


### Simple command list (undocummented)
```js
!q/!queue "yt video name"
!yt/!youtube "yt link"
!play "link"
!search/!searchyt/!ytsearch "what to search for"
!splay "search index"
!smore
!seek
!volume
!pause
!resume
!stop
```