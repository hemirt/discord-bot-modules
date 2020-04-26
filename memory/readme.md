# Modular Discord Bot 
## Memory module

Simple module that lets you save some object/data unique to one discord server.

### Installation

**This module is not yet fully finished and is missing some features such as caching/saving data.**

This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module doesnt require any config.js changes.

```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```
### Example usage in other modules
```js
    var { Memory } = moduleLoader.getModule('MEMORY.JS').exports;

    client.guilds.cache.map((guild) => {
        //get reference
        var serverMemory = Memory.getMemory(id);
        //save something
        serverMemory.something = true;
    });
```