var moduleFunction = async(client, moduleLoader, config) => {

    var { ObjectDataModel, TYPES } = moduleLoader.getModule('OBJMDL.JS').exports;

    class songModel extends ObjectDataModel {
        constructor(...args) {
            super(args, {
                name: TYPES.STRING,
                title: TYPES.STRING,
                url: TYPES.STRING,
            });
        }
    }

    return {
        name: 'Music Models',
        exports: {
            songModel: songModel
        },
        unload: async() => {
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: ['OBJMDL.JS'],
    code: 'MUSICMODELS.JS',
};