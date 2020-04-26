var moduleFunction = async(client, moduleLoader, config) => {
    var { to } = require('./helpers');
    var path = require('path');
    var fs = require("fs");

    async function getCached(file, getData, processData, recache = false) {
        var filePath = path.join(file.join("/"));

        try {
            if (recache)
                throw new Error("We threw an error to execute error block to force recache, its cheating but it works")

            var data = fs.readFileSync(filePath, 'utf8');
            return await processData(data);
        } catch (err) {
            var data = await getData();

            if (!data)
                return false;

            if (typeof data != "string")
                data = JSON.stringify(data);

            fs.writeFileSync(filePath, data);

            return await processData(data);
        }
    }

    return {
        name: 'Cache System',
        exports: {
            getCached
        },
        unload: async() => {
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'CACHE.JS',
};