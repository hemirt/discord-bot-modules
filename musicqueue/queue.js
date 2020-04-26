var moduleFunction = async(client, moduleLoader, config) => {
    var { to } = require('./helpers');

    class queueSystem {
        constructor(model) {
            this.model = model;

            this.queue = [];

            this.add = this.add.bind(this);
            this.get = this.get.bind(this);
            this.remove = this.remove.bind(this);
        }


        add(song, name, url) {
            try {
                var song = new this.model(song, name, url);
                this.queue.push(song);
                return true;
            } catch (err) {
                console.error('An error occured while adding song to queue', song, name, url);
                return false;
            }

            return false;
        }

        get(index) {
            if (this.queue.length > index)
                return this.queue.splice(index, 1)[0];
            return false;
        }

        remove(index) {
            if (this.queue.length > index)
                return this.queue.splice(index, 1);
            return false;
        }
    }

    return {
        name: 'Queue System',
        exports: {
            queueSystem: queueSystem,
        },
        unload: async() => {
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: ['OBJMDL.JS'],
    code: 'QUEUE.JS',
};