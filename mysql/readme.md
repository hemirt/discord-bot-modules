# Modular Discord Bot 
## MySQL

Module that will provide MySQL access to other modules in some normalized way.

### Installation
This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module doesnt require any config.js changes.


```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```

Modify config.js
```js
module.exports = {
   ...
    mysql: {
        host: "localhost",
        user: "mysql_user",
        password: "mysql_password",
        database: "bot_database",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    ...
}
```
### Example usage in other modules
```js
    var { pool } = moduleLoader.getModule('MYSQL.JS').exports;
    
    var { to } = require('./helpers');
    var [err, data] = await to(pool.exec('SELECT * from table'));
    if(err)
        return false;
        
    console.log(data); //do whatever you want
```