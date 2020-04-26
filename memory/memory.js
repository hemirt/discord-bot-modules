var moduleFunction = async(client, moduleLoader, config) => {

    class Memory {
        constructor() {
            this.memory = {

            }

            this.createMemory = this.createMemory.bind(this);
            this.getMemory = this.getMemory.bind(this);
            this.deleteMemory = this.deleteMemory.bind(this);
        }

        createMemory(id) {
            if (!(id in this.memory)) {
                this.memory[id] = {

                }
                return true;
            }
            return false;
        }

        getMemory(id) {
            if (!(id in this.memory))
                this.createMemory(id);

            return this.memory[id];
        }

        deleteMemory(id) {
            if (id in this.memory) {
                delete this.memory[id]
                return true;
            }
            return false;
        }
    }

    var discordMemory = new Memory();

    return {
        name: 'Queue System',
        exports: {
            Memory: discordMemory,
        },
        unload: async() => {
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'MEMORY.JS',
};