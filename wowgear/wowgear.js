var moduleFunction = async(client, moduleLoader, config) => {
    var { to, isArray } = require('./helpers');

    var { simpleRequest } = moduleLoader.getModule('REQUEST.JS').exports;
    var { channelMiddleWare, CommandSystem } = moduleLoader.getModule('CMD.JS').exports;
    var permissionMiddleWare = moduleLoader.getModule('PERMISSIONS.JS').exports.permissionMiddleWare;
    var getCached = moduleLoader.getModule('CACHE.JS').exports.getCached;
    var { pool } = moduleLoader.getModule('MYSQL.JS').exports;

    var fs = require("fs")
    const fsExtra = require('fs-extra')
    var path = require('path');

    var jsonProcessCache = function() {
        return async(data) => {
            try {
                data = JSON.parse(data);

                if (data.length <= 0 || !data)
                    return false;

                return data;
            } catch (err) {
                return false;
            }
        }
    }

    var jsonGetData = function(url) {
        return async(data) => {
            var [err, data] = await simpleRequest(url);

            if (err)
                return false;

            try {
                data = JSON.parse(data);

                if (data.length <= 0 || !data)
                    return false;

                return data;
            } catch (err) {
                return false;
            }
        }
    }

    class autoLogs {
        constructor() {
            this.checkLogs = this.checkLogs.bind(this);
            this.unload = this.unload.bind(this);

            this.updateInterval = setInterval(this.checkLogs, config.wow.logUpdateFrequency * 1000);
            this.checkLogs();
        }

        unload() {
            clearInterval(this.updateInterval)
        }

        async checkLogs() {
            if (!GS)
                return false;

            var results = await GS.getReports(true, true);
            var channel = client.channels.cache.find(channel => channel.id == config.wow.logsChannel);

            if (channel) {
                results.forEach(log => {
                    console.log("New log uploaded", log.title, log.id)
                    channel.send(log.title + " - https://classic.warcraftlogs.com/reports/" + log.id)
                });
            }
        }
    }

    class gearSystem {
        constructor(model) {
            this.getGear = this.getGear.bind(this);
            this.getReports = this.getReports.bind(this);
            this.getReport = this.getReport.bind(this);
            this.getPlayerCacheURL = this.getPlayerCacheURL.bind(this);
        }

        getPlayerCacheURL(name = "") {
            var goodName = name.replace(/[;\\/:*?\"<>|&']/g, '');

            var playerCache = fs.readdirSync(path.join(__dirname, config.wow.cacheDir, "players"));

            if (!playerCache.includes(goodName + ".json"))
                return false;

            return path.join(__dirname, config.wow.cacheDir, "players", goodName + ".json");
        }

        async getReports(recache = false, getNewOnly = false) {
            var [serr, sdata] = await to(pool.newQuery('SELECT * FROM `last_reports` order by end desc'));

            var lastLogEnd = 0;

            if (sdata.length == 0)
                recache = true;

            if (sdata.length > 0)
                lastLogEnd = sdata[0].end;


            if (recache) {

                var [err, data] = await simpleRequest('https://classic.warcraftlogs.com:443/v1/reports/guild/' + config.wow.guild + '/' + config.wow.realm + '/EU?api_key=' + config.wow.apiKey);
                if (err) {
                    return false;
                }
                try {
                    data = JSON.parse(data);

                    if (data.length <= 0 || !data)
                        return false;

                } catch (err) {
                    return false;
                }

                var vals = data.filter(log => (log.end > lastLogEnd && log.zone != -1 && log.zone != "-1"))
                var mappedVals = vals.map(log => [log.id, log.title, log.owner, log.start, log.end, log.zone]);

                if (vals.length > 0) {
                    await to(pool.newQuery('INSERT INTO `last_reports` (id, title, owner, start, end, zone) VALUES ?', [mappedVals]));
                }

                var sortedVals = vals.sort(function compare(a, b) {
                    if (a.end > b.end) return 1;
                    if (b.end > a.end) return -1;

                    return 0;
                });

                return getNewOnly ? sortedVals : data;
            } else {
                return sdata;
            }
        }

        async getReport(code) {

            var goodCode = code.replace(/[^A-Za-z0-9]+/g, '');

            var data = await getCached([__dirname, config.wow.cacheDir, goodCode + ".json"], jsonGetData('https://classic.warcraftlogs.com:443/v1/report/fights/' + goodCode + '?api_key=' + config.wow.apiKey), jsonProcessCache());

            return data;
        }

        async getGear(name, recache = false) {
            if (!name || typeof name != "string")
                return false;

            var goodName = name.replace(/[;\\/:*?\"<>|&']/g, '');


            var data = await getCached([__dirname + config.wow.cacheDir + "players/" + goodName + ".json"], async() => {
                var rdata = [];
                for (var i in config.wow.raids) {
                    var [err, data] = await simpleRequest(encodeURI('https://classic.warcraftlogs.com:443/v1/parses/character/' + goodName + '/' + config.wow.realm + '/EU?api_key=' + config.wow.apiKey + '&zone=' + config.wow.raids[i]));

                    if (err) {
                        continue;
                    }

                    try {
                        var temp = JSON.parse(data);
                        rdata = [...rdata, ...temp];
                    } catch (err) {
                        continue;
                    }

                }
                return rdata.length > 0 ? rdata : false;

            }, async(data) => {
                try {
                    if (!isArray(data))
                        data = JSON.parse(data);

                    if (data.length <= 0 || !data) {
                        return false;
                    }

                    var mostRecentEncounter = {
                        startTime: 0
                    }

                    data.map((obj) => {
                        if (obj.gear[0].id != null) {
                            if (obj.startTime > mostRecentEncounter.startTime) {
                                mostRecentEncounter = obj;
                            }
                        }
                    });

                    return mostRecentEncounter;

                } catch (err) {
                    return false;
                }
            }, recache);
            return data;
        }

    }

    var GS = new gearSystem();
    var AutoLogs = new autoLogs();

    CommandSystem.addCommand(['!item'], 'WOWGEAR_SCREEN', 'gets item tooltip', async(message, args) => {
        if (args.length <= 1) {
            message.channel.send('Missing argument');
            return false;
        }
        try {

            await page.goto(config.wow.webUrl + ':' + config.wow.webPort + '/itemtooltiphtml/' + args[1]); // go to site
            await page.waitForSelector('#screenshotthis'); // wait for the selector to load
            const element = await page.$('#screenshotthis'); // declare a variable with an ElementHandle
            var screen = await element.screenshot();

            const attachment = new MessageAttachment(screen);

            message.channel.send("some text", attachment);
        } catch (err) {
            message.channel.send("ERR");
        }

    }, [channelMiddleWare(config.wow.channel), permissionMiddleWare('WOWGEAR_GET')])

    CommandSystem.addCommand(
        ['!gear', '!getgear'],
        'WOWGEAR_GET',
        'gets players gear',
        async(message, args) => {
            if (message.channel.type !== 'text') return;

            if (args.length <= 1) {
                message.channel.send('Missing argument');
                return false;
            }

            var qstring = message.content.substr(message.content.indexOf(' ') + 1);
            var msg = await message.channel.send('Searching for ' + qstring);

            var gear = await GS.getGear(args[1]);

            if (!gear) {
                msg.edit('Failed to find gear of ' + qstring);
                return false;
            }

            var items = [];
            for (var item in gear.gear) {

                if (gear.gear[item].id == "0" || gear.gear[item].id == 0)
                    continue;

                items.push(gear.gear[item].name + " - [WH](https://www.classic.wowhead.com/item=" + gear.gear[item].id + ")");
            }

            //https://medium.com/@Dragonza/four-ways-to-chunk-an-array-e19c889eac4
            function chunk(array, size) {
                const chunked_arr = [];
                let copied = [...array]; // ES6 destructuring
                const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
                for (let i = 0; i < numOfChild; i++) {
                    chunked_arr.push(copied.splice(0, size));
                }
                return chunked_arr;
            }

            var chunks = chunk(items, 5);

            var embed = {
                "embed": {
                    "color": 92617,
                    "timestamp": gear.startTime,
                    "footer": {
                        "text": gear.encounterName
                    },
                    "thumbnail": {
                        "url": "https://ih0.redbubble.net/image.769425958.3546/flat,550x550,075,f.u4.jpg"
                    },
                    "author": {
                        "name": "Warcraft Logs Gear Report",
                        "icon_url": "https://ih0.redbubble.net/image.769425958.3546/flat,550x550,075,f.u4.jpg"
                    },
                    "fields": [{
                            "name": "Name",
                            "value": gear.characterName + " - " + gear.server,
                            "inline": true
                        },
                        {
                            "name": "Class",
                            "value": gear.class + " - " + gear.spec,
                            "inline": true
                        }
                    ]
                }
            }

            for (var i in chunks) {
                var temp = Number(i) + 1;
                embed.embed.fields.push({
                    "name": "Gear " + temp + "/" + chunks.length,
                    "value": chunks[i].join("\n")
                })
            }

            embed.embed.fields.push({
                "name": "Encounter info",
                "value": "Chosen most recent encounter with valid data",
            })

            embed.embed.fields.push({
                "name": "Armory",
                "value": config.wow.webUrl + ':' + config.wow.webPort + "/armory/" + gear.characterName
            })

            msg.edit(embed);


        }, [channelMiddleWare(config.wow.channel), permissionMiddleWare(['WOWGEAR_GET'])]
    );

    CommandSystem.addCommand(
        ['!recache', '!recache'],
        'WOWGEAR_REACACHE',
        'gets link for item',
        async(message, args) => {
            if (message.channel.type !== 'text') return;

            var msg = await message.channel.send('Recaching is really long process. >> Getting list of all reports.');
            await new Promise(r => setTimeout(r, 2000));
            var reports = await GS.getReports(true);

            if (!reports)
                return await msg.edit("An error occured")

            var reportsDL = {

            }

            await msg.edit('Downloading last ' + config.wow.lastReports + ' reports')

            for (var i = 0; i < config.wow.lastReports; i++) {
                msg.edit('Downloading ' + (Number(i) + 1) + "/" + config.wow.lastReports + " reports - " + reports[i].title)
                var report = await GS.getReport(reports[i].id)
                if (report)
                    reportsDL[reports[i].id] = report;
            }

            await msg.edit('Merging players in all parses')

            var players = []

            for (var i in reportsDL) {
                reportsDL[i].exportedCharacters.map(player => {
                    if (players.indexOf(player.name) === -1) {
                        players.push(player.name);
                    }
                })
            }


            //await msg.edit("Deleting cache, downloading and then caching gear of " + players.length + " players")

            //fsExtra.emptyDirSync(__dirname + GS.cacheDir + "/players")

            for (var i in players) {
                await msg.edit("Downloading and caching gear of " + players[i])
                await GS.getGear(players[i], true);
                await new Promise(r => setTimeout(r, 10000));
            }

            await msg.edit("Caching complete")


        }, [channelMiddleWare(config.wow.channel), permissionMiddleWare(['WOWGEAR_RECACHE'])]
    );

    CommandSystem.addCommand(
        ['!compareclass', '!compare'],
        'WOWGEAR_COMPARECLASS',
        'compares gear of multiple players of one class',
        async(message, args) => {
            if (message.channel.type !== 'text') return;

            if (args.length <= 1) {
                message.channel.send('Missing argument');
                return false;
            }

            var reports = await GS.getReports();

            var reportsDL = {

            }

            for (var i = 0; i < 5; i++) {
                var report = await GS.getReport(reports[i].id)
                if (report)
                    reportsDL[reports[i].id] = report;
            }

            var players = []

            for (var i in reportsDL) {
                reportsDL[i].friendlies.map(player => {
                    if (players.indexOf(player.name) === -1 && player.type.toUpperCase() == args[1].toUpperCase()) {
                        players.push(player.name);

                    }
                })
            }

            var type = args[2] === "table" ? "table" : "armory";

            if (players.length > 0)
                message.channel.send(config.wow.webUrl + ':' + config.wow.webPort + "/" + type + "/" + players.join(","))
            else
                message.channel.send("Class not found.")
        }, [channelMiddleWare(config.wow.channel)]
    );


    return {
        name: 'Wow gear',
        exports: {
            GS: GS,
        },
        unload: async() => {
            AutoLogs.unload();
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: ['CMD.JS', 'PERMISSIONS.JS', "CACHE.JS", "REQUEST.JS", "MYSQL.JS"],
    code: 'WOWGEAR.JS',
};