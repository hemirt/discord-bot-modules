var moduleFunction = async(client, moduleLoader, config) => {
    const mysql = require('mysql2/promise');

    var pool = mysql.createPool(config.mysql);

    pool.on('error', function(err) {
        console.error(err); // 'ER_BAD_DB_ERROR'
    });

    pool.exec = async(sql, params = null) => {
        try {
            return (await pool.execute(sql, params))[0];
        } catch (err) {
            return err;
        }
    }

    pool.newQuery = async(sql, params = null) => {
        try {
            return (await pool.query(sql, params))[0];
        } catch (err) {
            return err;
        }
    }

    return {
        name: 'MYSQL',
        exports: {
            pool: pool
        },
        unload: async() => {
            pool.end()
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'MYSQL.JS',
};