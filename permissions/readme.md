# Modular Discord Bot 
## Music Queue Module

**This module has not been rewritten yet to support permissions unique to each server.**
Simple module providing an unified permission system for each module.

### Installation

This is module for [Modular Discord Bot](https://github.com/eskejpo/escape-discord-bot).
This module doesnt require any other modules for its functionality.
This module doesnt require any config.js changes.

```txt
1. Download this module
2. Extract it into ./modular-discord-bot/plugins/
```
### Example usage in other modules

This permission system was meant to be used as a middleware for commands module.
```js

    var { channelMiddleWare, CommandSystem } = moduleLoader.getModule("CMD.JS").exports;
    var { permissionSystem, permissionMiddleWare } = moduleLoader.getModule("PERMISSIONS.JS").exports;
    //permissionMiddleWare(arrayOfPermissions) // ["SOME_PERMISSIONS"] //"ADMIN" overrules any permission

    /*CommandSystem.addCommand(["!command"], "COMMAND_NAME", "COMMAND_DESCRIPTION", async(m, a) => {
        
    }, permissionMiddleWare(["ADMIN"]))*/

    CommandSystem.addCommand(["!takerole"], "ROLE_TAKE", "Takes role of user", async(message, args) => {
        if (message.channel.type !== 'text') return;

        if (args.length <= 1) {
            await message.reply('Missing one or more arguments')
            return false;
        }

        var who = String(args[1])

        let user = message.guild.members.cache.find(member => member.nickname === who || member.user.username === who);

        if (!user) {
            await message.reply("User not found")
            return false;
        }

        var roleDel = permissionSystem.delUserRole(user.id);

        if (roleDel) {
            await message.reply("Successfully taken role of " + who + " away")
            return true;
        }

        await message.reply("Failed to take role away.")

    }, [permissionMiddleWare(["ADMIN"])]);
```