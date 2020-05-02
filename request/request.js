var moduleFunction = async(client, moduleLoader, config) => {
    var request = require('request');
    var { to } = require('./helpers');

    var options = (url) => {
        return {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
            },
        };
    }

    function doRequest(url) {
        return new Promise(function(resolve, reject) {
            request(url, function(error, res, body) {
                if (error)
                    console.error(error)
                else if (res.statusCode == 200)
                    resolve(body);

                resolve(false);
            });
        });
    }

    return {
        name: 'Request Function',
        exports: {
            options,
            doRequest,
            simpleRequest
        },
        unload: async() => {

        },
    };

    function simpleRequest(url) {
        return to(doRequest(options(url)))
    }
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'REQUEST.JS',
};