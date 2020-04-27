var moduleFunction = async(client, moduleLoader, config) => {
    var { to, isArray, isNumber } = require('./helpers');
    const { MessageAttachment } = require('discord.js');
    var fs = require("fs")
    var path = require('path');
    const puppeteer = require('puppeteer');
    var { GS } = moduleLoader.getModule('WOWGEAR.JS').exports;
    var { pool } = moduleLoader.getModule('MYSQL.JS').exports;
    var stringSimilarity = require('string-similarity');

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    function ITH(item) {
        return `
            <!DOCTYPE html>
                <html>

                <head>
                    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width">
                    <title>Coffee Armory</title>
                    <link rel="stylesheet" href="/assets/basic.css">
                    <base href="/../../">
                </head>

                <body>
                    <div id="screenshotthis">
                        <div class="wowhead-tooltip wowhead-tooltip-width-restriction wowhead-tooltip-width-320" style="width: 320px; visibility: visible;">
                            ${item}
                        </div>
                    </div>
                </body>

            </html>`
    }

    const express = require('express')
    const app = express()
    const port = config.wow.webPort

    app.get('/itemtooltiphtml/:id', async(req, res) => {
        req.params.id = Number(req.params.id);
        if (!req.params.id || req.params.id == NaN) {
            res.status(403).json({
                error: "No or wrong parameter"
            })
            return false;
        }

        var [err, data] = await to(pool.exec('SELECT * from tooltips where id = ? limit 1', [req.params.id]));

        if (err) {

            res.status(404).json({
                error: "Tooltip not found"
            })

        } else if (data.length > 0) {

            res.send(ITH(data[0].tooltip))

        } else {

            res.status(403).json({
                error: "Unknown error"
            })

        }
    })

    app.get('/character/:character', (req, res) => {
        if (!req.params.character)
            return res.status(404).json({
                error: "No or wrong parameter"
            })

        var characterURI = GS.getPlayerCacheURL(req.params.character)
        if (!characterURI)
            return res.status(404).json({
                error: "Character not found"
            })

        res.sendFile(characterURI)
    })

    app.get('/characters', async(req, res) => {
        var reports = await GS.getReports();

        if (!reports) {
            res.status(403).json({
                error: "Error occured"
            })
            return false;
        }

        var reportsDL = {

        }

        for (var i = 0; i < 5; i++) {
            var report = await GS.getReport(reports[i].id)
            if (report)
                reportsDL[reports[i].id] = report;
        }

        var players = []

        for (var i in reportsDL) {
            reportsDL[i].exportedCharacters.map(player => {
                if (players.indexOf(player.name) === -1) {
                    players.push(player.name);

                }
            })
        }

        res.json(players);
    })

    app.get('/armory/:name', (req, res) => {
        res.sendFile(path.join(__dirname, config.wow.webDir, "template.html"))
    })

    app.get('/table/:name', (req, res) => {
        res.sendFile(path.join(__dirname, config.wow.webDir, "tabletemplate.html"))
    })

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, config.wow.webDir, "index.html"))
    })

    app.get('/itemtooltip/:id', async(req, res) => {
        req.params.id = Number(req.params.id);
        if (!req.params.id || req.params.id == NaN) {
            res.status(403).json({
                error: "No or wrong parameter"
            })
            return false;
        }

        var [err, data] = await to(pool.exec('SELECT * from tooltips where id = ? limit 1', [req.params.id]));

        if (err) {

            res.status(404).json({
                error: "Tooltip not found"
            })

        } else if (data.length > 0) {

            res.json(data[0])

        } else {

            console.error(data, err)

            res.status(403).json({
                error: "Unknown error"
            })

        }
    })

    app.get('/itemtooltiparray/:id_array', async(req, res) => {

        try {
            req.params.id_array = JSON.parse(req.params.id_array)
            for (var i in req.params.id_array) {
                if (!isNumber(req.params.id_array[i])) {
                    res.status(403).json({
                        error: "No or wrong parameter e1"
                    })
                    return false;
                }
            }
        } catch (err) {
            res.status(403).json({
                error: "No or wrong parameter e2"
            })
            return false;
        }

        if (!req.params.id_array || !isArray(req.params.id_array)) {
            res.status(403).json({
                error: "No or wrong parameter e3"
            })
            return false;
        }

        if (req.params.id_array.length >= 20) {
            res.status(404).json({
                error: "Array argument length > 20 => err"
            })
            return false
        }

        var [err, data] = await to(pool.newQuery('SELECT tooltips.*,item_template.itemset FROM tooltips INNER JOIN item_template ON tooltips.id=item_template.entry WHERE tooltips.id in (?)', [req.params.id_array]));

        if (err) {

            res.status(404).json({
                error: "Tooltip not found"
            })

        } else if (data.length > 0) {

            res.json(data)

        } else {

            console.error(data, err)

            res.status(403).json({
                error: "Unknown error"
            })

        }
    })

    app.get('/compare', (req, res) => {
        res.send('Compare characters test')
    })

    client.on('message', async(message) => {
        var smsg = message.content.match(/\[\[(.*?)\]\]/gm) || [];

        for (var i in smsg)
            smsg[i] = smsg[i].replace(/[\[\]]+/g, '')

        if (smsg.length <= 0)
            return false;

        try {
            //asd
            var [err, data] = await to(pool.newQuery('SELECT id, name from tooltips'));

            if (err || data.length <= 0)
                return false;

            var nameDB = data.map(obj => { return obj.name });

            var items = []
            smsg.forEach(element => {
                var matches = stringSimilarity.findBestMatch(element, nameDB);
                if (matches.bestMatch.rating > 0.6)
                    items.push(matches.bestMatch.target);
            });

            data = data.filter(single => items.includes(single.name));

            if (err || data.length <= 0)
                return false;


            for (var i in data) {
                console.log("trying to render", data[i].id)
                await page.goto('http://173.249.47.181:3159/itemtooltiphtml/' + data[i].id);

                if (!page.$("#screenshotthis"))
                    return false;

                await page.waitForSelector('#screenshotthis');
                const element = await page.$('#screenshotthis');
                var screen = await element.screenshot();

                const attachment = new MessageAttachment(screen);
                message.channel.send(data[i].name, attachment);
            }

        } catch (err) {
            console.log(err)
                //message.channel.send("An error occu");
        }
    });

    app.use(express.static(path.join(__dirname, config.wow.webDir)))

    app.use(function(req, res, next) {
        res.send("404")
    });

    var server = app.listen(port, () => console.log(`[WoWGear Server] Running on port ${port}!`))

    return {
        name: 'Wow Gear API',
        exports: {

        },
        unload: async() => {
            server.close();
            console.log(`[WoWGear Server] Server Closed!`)
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: ['WOWGEAR.JS', 'MYSQL.JS'],
    code: 'WOWGEARAPI.JS',
};