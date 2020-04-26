# Modular Discord Bot 
## YouTube

Module that provides other modules an interface, that allows you to search YouTube, get direct links etc. See MUSIC.JS module to see how it works.

### Installation
This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module **requires** changes to config.js.


```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```

Modify config.js
```js
module.exports = {
   ...
    YouTube: {
        "apiKey": "",//youtube api key
        //Prefered formats array
        "PFA": [251, 172, 101, 102, 46, 141, 22, 37, 38, 45, 84], //allowed formats, order = priority
        //if none of these formats is found, choose other at random?
        "randomOnFailPFA": true
    },
    ...
}
```
### Example usage in other modules
```txt
Example in MUSIC.JS mnodule
```


### Required moduless

This module requires these extra modules to work

| Plugin | Link |
| ------ | ------ |
| Request Module | https://github.com/eskejpo/discord-bot-modules/tree/master/request |