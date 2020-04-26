var moduleFunction = async function(client, moduleLoader, config) {
    var request = require('request');
    var cipher = require('./YouTube/sig.js');
    var common = require('./YouTube/common.js');
    var { to } = require('./helpers');

    var { simpleRequest } = moduleLoader.getModule('REQUEST.JS').exports;

    class YouTube {
        constructor() {
            this.cipherKey = false;
            this.gscript = false;

            this.interval = setInterval(() => {
                this.updateConfigPlayer()
            }, 1000 * 60 * 60 * 0.5);

            this.getVideo = this.getVideo.bind(this);
            this.updateConfigPlayer = this.updateConfigPlayer.bind(this);
            this.getCipher = this.getCipher.bind(this);
            this.qsToJson = this.qsToJson.bind(this);
            this.retrieve = this.retrieve.bind(this);
            this.getPlayableVideo = this.getPlayableVideo.bind(this);
            this.YouTubeGetID = this.YouTubeGetID.bind(this);
            this.destroy = this.destroy.bind(this);
            this.parseVideoInfo = this.parseVideoInfo.bind(this);

            this.updateConfigPlayer();
        }

        destroy() {
            clearInterval(this.interval);
        }

        YouTubeGetID(url) {
            var ID = '';
            url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
            if (url[2] !== undefined) {
                ID = url[2].split(/[^0-9a-z_\-]/i);
                ID = ID[0];
                return ID;
            }
            return url;
        }

        async getVideo(url) {
            var links = await this.retrieve(url);
            var linky = {};

            if (typeof links == 'undefined') return false;

            if (links.length <= 0) return false;

            var linky = {};

            for (var i in links) {
                linky[links[i].itag] = links[i];
            }

            return linky;
        }

        async getPlayableVideo(url) {
            var data = await this.getVideo(this.YouTubeGetID(url));

            var pref = config.YouTube.PFA;
            for (var i in data) {
                if (pref.includes(i)) {
                    return data[i].url;
                }
            }

            if (config.YouTube.randomOnFailPFA) {
                var vals = Object.values(data);
                if (vals.length > 0) return vals[0].url;
            }
            return false;
        }

        async updateConfigPlayer(callback) {
            try {
                var [err, data] = await simpleRequest('https://www.youtube.com/watch?v=lulasddom')));
        if (err) throw new Error(err);

        var script = data.match(/.*src="(.+?)".*name="player(.+?)".*/g);
        if (script == null) return;
        if (script.length > 0) {
            script = script[0].substring(script[0].indexOf('"') + 1);
            script = script.substring(0, script.indexOf('"'));
            if (!script.includes('.com')) {
                this.gscript = 'https://youtube.com/' + script;
            } else {
                this.gscript = script;
            }

            cipher.getTokens(this.gscript, { requestOptions: true }, (a, b) => {
                this.cipherKey = b;
                if (typeof callback == 'function') callback();
            });
        }
    } catch (err) {
        console.log("Couldnt update YT Config Player", err)
        this.updateConfigPlayer(callback);
    }
}

getCipher(signature) {
    return cipher.decipher(this.cipherKey, signature);
}

qsToJson(qs) {
    var res = {};
    var pars = qs.split('&');
    var kv, k, v;

    var special = ['title', 'author'];

    for (var i in pars) {
        kv = pars[i].split('=');
        k = kv[0];
        v = kv[1];
        if (special.includes(v)) res[k] = decodeURIComponent(v);
        else res[k] = decodeURIComponent(v.replaceAll('\\+', ' '));
    }
    return res;
}

parseVideoInfo(videoInfo) {
    /*
    no longer needed
    */
    return videoInfo;
}

async retrieve(id) {
var url = 'https://www.youtube.com/get_video_info?video_id=' + id + "&el=detailpage&eurl=https://youtube.googleapis.com/v/" + id + "&hl=en";
var [err, body] = await simpleRequest(url)));
if (err) throw new Error(err);

if (!body) return false;

var videoInfo = this.qsToJson(body);

try {
    var PRData = JSON.parse(videoInfo.player_response);
    videoInfo.player_response = PRData;
} catch (err) {
    return false;
}

let playability = videoInfo.player_response.playabilityStatus;
if (playability && playability.status === 'UNPLAYABLE') {
    return false;
}

let formats = [];
if (videoInfo.player_response.streamingData) {
    if (videoInfo.player_response.streamingData.formats) {
        formats = formats.concat(videoInfo.player_response.streamingData.formats);
    }
    if (videoInfo.player_response.streamingData.adaptiveFormats) {
        formats = formats.concat(videoInfo.player_response.streamingData.adaptiveFormats);
    }
}
cipher.decipherFormats(formats, this.cipherKey);
formats = this.parseVideoInfo(formats);
return formats;
}
}

class YouTubeAPI {
    constructor() {
        this.buildURLQuery = this.buildURLQuery.bind(this);
        this.buildApi = this.buildApi.bind(this);
        return this;
    }

    buildURLQuery(obj) {
        return Object.entries(obj)
            .map(pair => pair.map(encodeURIComponent).join('='))
            .join('&');
    }

    async buildApi(api, data) {
        var param = '?' + this.buildURLQuery(data);
        var address =
            'https://www.googleapis.com/youtube/v3/' + api + '/' + param + '&key=' + config.YouTube.apiKey;

        var [err, data] = await simpleRequest(address)));
if (err) throw new Error(err);

if (!data) return false;

var parsed = common.TryParse(data);

if (parsed) return parsed;

return false;
}
}

class YouTubeSearch {
    constructor() {
        this.api = new YouTubeAPI();
        this.searchString = '';
        this.searchToken = '';
        this.lastSearch = [];

        this.search = this.search.bind(this);
        this.searchMore = this.searchMore.bind(this);
    }

    async search(searchString) {
        var apiDetails = {
            part: 'snippet',
            q: searchString,
            type: 'video',
        };

        var data = await this.api.buildApi('search', apiDetails);

        if (!data) return false;

        this.searchString = searchString;
        this.nextPageToken = data.nextPageToken;
        this.lastSearch = data.items;

        return data.items;
    }

    async videos(videoID) {
        var apiDetails = {
            part: 'snippet',
            id: videoID
        };

        var data = await this.api.buildApi('videos', apiDetails);

        if (!data) return false;

        return data.items;
    }

    async searchMore() {
        if (this.searchString.length <= 0 || this.nextPageToken.length <= 0) return false;

        var apiDetails = {
            part: 'snippet',
            q: this.searchString,
            type: 'video',
            pageToken: this.nextPageToken,
        };

        var data = await this.api.buildApi('search', apiDetails);

        if (!data) return false;

        this.nextPageToken = data.nextPageToken;
        this.lastSearch = data.items;

        return data.items;
    }
}

var YT = new YouTube();

return {
    name: 'YouTube System',
    exports: {
        yt: YT,
        ytApiClass: YouTubeAPI,
        ytSearchClass: YouTubeSearch,
    },
    unload: async() => {
        YT.destroy();
        delete YT;

        return true; //success
    },
};
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'YT.JS',
};