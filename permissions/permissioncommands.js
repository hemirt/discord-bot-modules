var moduleFunction = async(client, moduleLoader, config) => {

    var { channelMiddleWare, CommandSystem } = moduleLoader.getModule("CMD.JS").exports;
    var { permissionSystem, permissionMiddleWare } = moduleLoader.getModule("PERMISSIONS.JS").exports;


    CommandSystem.addCommand(["!setrole"], "ROLE_SET", "Sets role of user", async(message, args) => {
        if (message.channel.type !== 'text') return;

        if (args.length <= 2) {
            await message.reply('Missing one or more arguments')
            return false;
        }

        var who = String(args[1])
        var what = String(args[2])

        var rolePermissions = permissionSystem.permissionRoles.getRolePermissions(what);

        if (!rolePermissions) {
            await message.reply("Role not found")
            return false;
        }

        let user = message.guild.members.cache.find(member => member.nickname === who || member.user.username === who);

        if (user) {
            permissionSystem.setUserRole(user.id, what);
            await message.reply('Role of ' + who + " set to " + what)
        }

    }, [channelMiddleWare("botshit"), permissionMiddleWare(["ADMIN"])]);

    CommandSystem.addCommand(["!getrole"], "ROLE_GET", "Gets role of user", async(message, args) => {
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

        var role = permissionSystem.getUser(user.id);

        if (role) {
            await message.reply('Role of ' + who + " is " + role)
            return true;
        }

        await message.reply("User does not have any role.")

    }, [channelMiddleWare("botshit"), permissionMiddleWare(["ADMIN"])]);

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

    }, [channelMiddleWare("botshit"), permissionMiddleWare(["ADMIN"])]);

    return {
        name: "Permission System Commands",
        exports: {

        },
        unload: async() => {
            return true;
        }
    }

}

module.exports = {
    module: moduleFunction,
    requires: ["CMD.JS", "PERMISSIONS.JS"],
    code: "PERMISSIONSCMD.JS"
}