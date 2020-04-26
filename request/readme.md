# Modular Discord Bot 
## Request Module

Module that provides other modules a simple function to do HTTP(s) request

### Installation
This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module doesnt require any changes to config.js.


```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```

### Example usage in other modules
```js
var [err, data] = await simpleRequest('https://api.somewebsite.com/v1/endpoint')));
if(err)
    throw err;

console.log(data);
```
