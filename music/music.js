var moduleFunction = async(client, moduleLoader, config) => {
    if (!client) throw new Error('No client passed');

    var https = require('https');
    var { to, YouTubeGetID } = require('./helpers');

    var { ObjectDataModel, TYPES } = moduleLoader.getModule('OBJMDL.JS').exports;
    var { Memory } = moduleLoader.getModule('MEMORY.JS').exports;
    var { songModel } = moduleLoader.getModule('MUSICMODELS.JS').exports;
    var channelMiddleWare = moduleLoader.getModule("CMD.JS").exports.channelMiddleWare;

    var miniget = require("miniget")

    var voiceConnectionMiddleware = async(client, message, next) => {
        var voiceConnection = await client.voice.connections.get(message.channel.guild.id);
        if (!voiceConnection) {
            if (message.channel.type !== 'text') return false;

            if (message.member.voice)
                if (message.member.voice.channel) {
                    if (!message.member.voice.channel.joinable)
                        return message.reply('Missing permissions to join that voice channel');

                    await message.member.voice.channel.join();
                } else {
                    message.reply('You need to join a voice channel first!');
                }
        }

        var voiceConnection = await client.voice.connections.get(message.channel.guild.id);

        if (!voiceConnection) return false;

        next();
    };

    class MusicManager {
        constructor() {
            this.hookCommands = this.hookCommands.bind(this);
            this.playYouTube = this.playURL.bind(this);
            this.destroy = this.destroy.bind(this);
            this.hookModules = this.hookModules.bind(this);
            this.guildCreate = this.guildCreate.bind(this);
            this.guildDelete = this.guildDelete.bind(this);
            this.initMemoryFor = this.initMemoryFor.bind(this);
            this.initMemory = this.initMemory.bind(this);
            this.hookDispatcher = this.hookDispatcher.bind(this);
            this.unhookDispatcher = this.unhookDispatcher.bind(this);

            this.volume = 1;

            this.yt = false;
            this.ytSearch = false;
            this.lastSearch = undefined;

            this.CommandSystem = false;
            this.activeRequest = false;
            this.queueActive = true;

            client.on("guildCreate", this.guildCreate);
            client.on("guildDelete", this.guildDelete);


            this.hookModules();
            this.initMemory();

            this.hookCommands();
        }

        hookDispatcher(dispatcher) {
            var id = dispatcher.player.voiceConnection.channel.guild.id;

            Memory.getMemory(id).onSongEnd = () => {
                var nextSong = Memory.getMemory(id).queue.get(0);

                if (nextSong && this.queueActive)
                    this.playURL(nextSong, {}, id);
            };

            dispatcher.on('end', Memory.getMemory(id).onSongEnd);
        }

        unhookDispatcher(dispatcher) {
            var id = dispatcher.player.voiceConnection.channel.guild.id;

            dispatcher.removeListener("end", Memory.getMemory(id).onSongEnd)
        }

        guildCreate(guild) {
            this.initMemoryFor(guild.id);
        }

        guildDelete(guild) {
            Memory.deleteMemory(guild.id)
        }

        initMemory() {

            /*
            error undefined
            */
            client.guilds.cache.map((guild) => {
                this.initMemoryFor(guild.id);
            });
        }

        initMemoryFor(id) {
            var serverMemory = Memory.getMemory(id);
            if (serverMemory) {
                serverMemory.queue = new this.queueSystem(songModel);
                serverMemory.currentMusic = new songModel("", "", "");
                serverMemory.onSongEnd = new Function();
            }
        }

        getLinkStream(url) {
            return miniget(url)
        }

        hookModules() {
            this.queueSystem = moduleLoader.getModule('QUEUE.JS').exports.queueSystem;
            this.CommandSystem = moduleLoader.getModule('CMD.JS').exports.CommandSystem;
            this.yt = moduleLoader.getModule('YT.JS').exports.yt;
            this.ytSearch = moduleLoader.getModule('YT.JS').exports.ytSearchClass;
            this.permissionMiddleWare = moduleLoader.getModule('PERMISSIONS.JS').exports.permissionMiddleWare;
        }

        destroy() {
            client.removeListener('guildCreate', this.guildCreate);
            client.removeListener('guildDelete', this.guildDelete);

            client.guilds.cache.forEach(guild => {
                if (guild.voice)
                    if (guild.voice.connection) guild.voice.connection.disconnect();
            });
        }

        async playURL(song, options, id) {
            if (!(song instanceof songModel))
                throw new Error("Provided song object is not instanceof songModel")

            var serverMemory = Memory.getMemory(id);
            var voiceConnection = serverMemory.voiceConnection;

            if (voiceConnection.player.dispatcher)
                await voiceConnection.player.dispatcher.end();

            var streamUrl = await this.yt.getPlayableVideo(song.url);

            if (!streamUrl) {
                console.log('Failed music 1');
                return false;
            }

            var res = await this.getLinkStream(streamUrl);


            serverMemory.currentMusic = song;

            var dispatcher = voiceConnection.play(res, {
                volume: this.volume,
                ...options,
            });


            this.hookDispatcher(dispatcher);

            var handleCallback = async(...args) => {
                voiceConnection.removeListener('disconnect', handleCallback);
                voiceConnection.removeListener('error', handleCallback);
                dispatcher.removeListener('finish', handleCallback);

                this.unhookDispatcher(dispatcher);

                dispatcher.end();
                serverMemory.currentMusic = new songModel("No Author", "No Title", "");

            };

            dispatcher.on('finish', handleCallback);

            voiceConnection.on('disconnect', handleCallback);
            voiceConnection.on('error', handleCallback);
            return true;
        }

        hookCommands() {
            this.CommandSystem.addCommand(
                ['!q', '!queue'],
                'QUEUE_ADD_SONG',
                'Adds song to queue',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    var voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (args.length <= 1) {
                        message.channel.send('Missing argument');
                        return false;
                    }

                    var qstring = message.content.substr(message.content.indexOf(' ') + 1);
                    var msg = await message.channel.send('Searching for ' + qstring);

                    var ytSearch = new this.ytSearch();
                    var data = await ytSearch.search(qstring);

                    if (!data) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    if (data.length <= 0) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    var video = data[0];
                    msg.edit('Adding to queue ' + video.snippet.title + ' https://www.youtube.com/watch?v=' + video.id.videoId);

                    var serverMemory = Memory.getMemory(message.guild.id);
                    serverMemory.queue.add(video.snippet.channelTitle, video.snippet.title, video.id.videoId);

                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC']), voiceConnectionMiddleware]
            );

            this.CommandSystem.addCommand(
                ['!yt', '!youtube'],
                'PLAY_YOUTUBE',
                'Plays youtube music',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (args.length <= 1) {
                        message.channel.send('Missing argument');
                        return false;
                    }

                    var qstring = message.content.substr(message.content.indexOf(' ') + 1);
                    var msg = await message.channel.send('Searching for ' + qstring);

                    var ID = YouTubeGetID(qstring);

                    var ytSearch = new this.ytSearch();
                    var data = await ytSearch.videos(ID);

                    if (!data) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    if (data.length <= 0) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    var video = data[0];
                    msg.edit('Playing ' + video.snippet.title + ' https://www.youtube.com/watch?v=' + video.id);

                    var res = await this.playURL(new songModel(video.snippet.title, video.snippet.channelTitle, video.id), {}, message.guild.id);

                    if (!res) {
                        msg.edit('Failed to play ' + video.snippet.title);
                        return false;
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC']), voiceConnectionMiddleware]
            );

            this.CommandSystem.addCommand(
                ['!play'],
                'SEARCH_PLAY_YOUTUBE',
                'Plays youtube music',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (args.length <= 1) {
                        message.channel.send('Missing argument');
                        return false;
                    }

                    var qstring = message.content.substr(message.content.indexOf(' ') + 1);
                    var msg = await message.channel.send('Searching for ' + qstring);

                    var ytSearch = new this.ytSearch();
                    var data = await ytSearch.search(qstring);

                    if (!data) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    if (data.length <= 0) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    var video = data[0];
                    msg.edit('Playing ' + video.snippet.title + ' https://www.youtube.com/watch?v=' + video.id.videoId);

                    var res = await this.playURL(new songModel(video.snippet.title, video.snippet.channelTitle, video.id.videoId), {}, message.guild.id);

                    if (!res) {
                        msg.edit('Failed to play ' + video.snippet.title);
                        return false;
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC']), voiceConnectionMiddleware]
            );

            this.CommandSystem.addCommand(
                ['!search', '!searchyt', '!ytsearch'],
                'SEARCH_YOUTUBE',
                'Searches youtube music',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    var qstring = message.content.substr(message.content.indexOf(' ') + 1);
                    var msg = await message.channel.send('Searching for ' + qstring);

                    this.lastSearch = new this.ytSearch();
                    var data = await this.lastSearch.search(qstring);

                    if (!data) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    if (data.length <= 0) {
                        msg.edit('Failed to find video for ' + qstring);
                        return false;
                    }

                    var msgtosend = '```css\n';
                    data.forEach((item, index) => {
                        msgtosend += String(index) + '. ' + item.snippet.title + '\n';
                    });
                    msgtosend += '\nUse !smore without arguments to see more';
                    msgtosend += '\nUse !splay number to play song';
                    msgtosend += '```';
                    msg.edit(msgtosend);
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['SEARCH'])]
            );

            this.CommandSystem.addCommand(
                ['!splay'],
                'SEARCH_RESULTS_PLAY',
                'Searches youtube music',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    var voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!this.lastSearch) return message.reply('You need to esarch for something first');

                    if (args.length < 1 || isNaN(args[1])) return message.reply('Missing argument');

                    var index = parseInt(args[1]);

                    if (index < 0 || index >= this.lastSearch.lastSearch.length) return false;

                    var video = this.lastSearch.lastSearch[index];
                    var msg = await message.channel.send(
                        'Playing ' + video.snippet.title + ' https://www.youtube.com/watch?v=' + video.id.videoId
                    );

                    var res = await this.playURL(new songModel(video.snippet.title, video.snippet.channelTitle, video.id.videoId), {}, message.guild.id);

                    console.log('res', res);

                    if (!res) {
                        msg.edit('Failed to play ' + video.snippet.title);
                        return false;
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['SEARCH']), voiceConnectionMiddleware]
            );

            this.CommandSystem.addCommand(
                ['!smore'],
                'SEARCH_RESULTS_MORE',
                'Searches youtube music',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    if (!this.lastSearch) return message.reply('You need to search for something first');

                    var data = await this.lastSearch.searchMore();

                    var msg = await message.channel.send('Searching more for ' + this.lastSearch.searchString);

                    if (!data) {
                        msg.edit('Failed to find video for ' + this.lastSearch.searchString);
                        return false;
                    }

                    if (data.length <= 0) {
                        msg.edit('Failed to find video for ' + this.lastSearch.searchString);
                        return false;
                    }

                    var msgtosend = '```css\n';
                    data.forEach((item, index) => {
                        msgtosend += String(index) + '. ' + item.snippet.title + '\n';
                    });
                    msgtosend += '\nUse !smore without arguments to see more';
                    msgtosend += '\nUse !splay number to play song';
                    msgtosend += '```';
                    msg.edit(msgtosend);
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['SEARCH'])]
            );

            this.CommandSystem.addCommand(
                ['!seek'],
                'SEEK_AUDIO',
                '',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (args.length <= 1) return false;

                    if (args[1] < 0) return false;

                    await this.playURL(serverMemory.currentMusic, { seek: args[1] }, message.guild.id);
                    await message.channel.send('Seeked to ' + args[1]);
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC'])]
            );

            this.CommandSystem.addCommand(
                ['!volume'],
                'CHANGE_VOLUME',
                '',
                async(message, args) => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (args.length <= 1) return false;

                    if (args[1] < 0) return false;

                    if (isNaN(args[1])) return false;
                    if (serverMemory.voiceConnection.player.dispatcher) {
                        await serverMemory.voiceConnection.player.dispatcher.setVolumeLogarithmic(args[1]);
                        this.volume = args[1];
                        await message.channel.send('Volume set to ' + args[1]);
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC'])]
            );

            this.CommandSystem.addCommand(
                ['!pause'],
                'PAUSE_AUDIO',
                '',
                async message => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (serverMemory.voiceConnection.player.dispatcher) {
                        serverMemory.voiceConnection.player.dispatcher.pause();
                        await message.channel.send('Paused');
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC'])]
            );

            this.CommandSystem.addCommand(
                ['!resume'],
                'RESUME_AUDIO',
                '',
                async message => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (serverMemory.voiceConnection.player.dispatcher) {
                        serverMemory.voiceConnection.player.dispatcher.resume();
                        await message.channel.send('Resumed');
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC'])]
            );

            this.CommandSystem.addCommand(
                ['!stop'],
                'STOP_AUDIO',
                '',
                async message => {
                    if (message.channel.type !== 'text') return;

                    //get server memory reference
                    var serverMemory = Memory.getMemory(message.guild.id);
                    //lets save voiceConnection reference to server memory, so it can be accessed outside of events lets say in queue system etc
                    if (!serverMemory.voiceConnection)
                        serverMemory.voiceConnection = await client.voice.connections.get(message.channel.guild.id);

                    if (!serverMemory.voiceConnection) return;

                    if (serverMemory.voiceConnection.player.dispatcher) {
                        await serverMemory.voiceConnection.player.dispatcher.end();
                        await message.channel.send('Stopped');
                    }
                }, [channelMiddleWare(config.music.textChannel), this.permissionMiddleWare(['MUSIC'])]
            );
        }
    }

    var Music = new MusicManager();

    return {
        name: 'Music System',
        exports: {
            Music: Music,
            voiceConnectionMiddleware: voiceConnectionMiddleware,
        },
        unload: async() => {
            Music.destroy();
            delete Music;

            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: ['CMD.JS', 'YT.JS', 'PERMISSIONS.JS', 'QUEUE.JS', 'OBJMDL.JS', 'MEMORY.JS', 'MUSICMODELS.JS'],
    code: 'MUSIC.JS',
};