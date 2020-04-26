# Modular Discord Bot 
## Cache module

Simple caching module, that caches with an option to force recache. You are able to provide a function to get data, cache it and send it to a data processing function, that will process given data before returning it.

### Installation

This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module doesnt require any config.js changes.

```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```
### Example usage in other modules
```js
    var getCached = moduleLoader.getModule('CACHE.JS').exports.getCached;

    var cachedData = await getCached([__dirname, "some_directory", "file.json"], async() => {
        //get data from internet
        var data = someNetworkRequest("http://api.google.com/data.json");
        //parse data
        data = JSON.parse(data);
        //return data to be saved
        return data
    }, async(data) => {
        //data = raw data from file
        //we need to parse data
        data = JSON.parse(data);

        //do something before returning it
        data.name = "peter";

        //return it, this is the final return
        return data;
    }, recache);
    //we can force to recache data
```