# Modular Discord Bot 
## WoW Armory, Tooltip, Automatic log posting

Module that will make wow armory available on a website or through a command on bot. Requires warcraftlogs API key and some configuration.

### Installation
This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module **requires** other modules to work, scroll down to get the list.
This module **requires** changes to config.js.


```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
3. npm install string-similarity puppeteer fs-extra 
4. Import wow.sql database
```

Modify config.js
```js
module.exports = {
   ...
    wow: {
        webUrl: "http://127.0.0.1"
        webPort: 3159,
        channel: "", //channel to limit commands to
        logsChannel: "", //id of channel to automatically post logs
        apiKey: "", //warcraftlogs classic api key
        realm: "", //realm
        guild: "", //exact guild name as on logs
        cacheDir: "/wowcache/", //cache dir
        webDir: "./wowgear/", //web directory (assets etc)
        //raids to update gear on, more raids = significantly longer recache
        raids: [1003, 1000, 1002],
        lastReports: 10,
        logUpdateFrequency: 300
    }
    ...
}
```

### Simple docs
```txt
Post in any channel: [[Staff of The Shadow Flame]] -> this will post image of tooltip of given item
!reacache - forces recache of data
!gear name
!compare class [table] (optional 3rd parameter)
```

### Required moduless

This module requires these extra modules to work

| Plugin | Link |
| ------ | ------ |
| Cache Module | https://github.com/eskejpo/discord-bot-modules/tree/master/cache |
| Request Module | https://github.com/eskejpo/discord-bot-modules/tree/master/request |
| Permissions Module | https://github.com/eskejpo/discord-bot-modules/tree/master/permissions |
| MySQL Module | https://github.com/eskejpo/discord-bot-modules/tree/master/mysql |