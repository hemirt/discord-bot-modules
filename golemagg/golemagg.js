var moduleFunction = async(client, moduleLoader, config) => {
    if (!client)
        throw new Error("No client passed");

    console.log("[BASE.JS] Adding commands")
    var CommandSystem = moduleLoader.getModule("CMD.JS").exports.CommandSystem;

    CommandSystem.addCommand(["!add"], "GOLEMAGG_GUILD_ADD", "Adds user to a golemagg guild (role)", async(message, args) => {
        if (message.channel.type !== 'text') return;

        var guild = client.guilds.cache.get(message.channel.guild.id);

        if (!guild || guild.id != config.golemagg.guild_id || message.channel.id != config.golemagg.channel_id) {
            return false;
        }

        if (args.length != 3) {
            message.reply("Expected command in this format: !add @user \"Guild Name\"")
            return false;
        }

        let guildRole = message.member.roles.cache.find(role => (role.name == "[H] " + args[2] || role.name == "[A] " + args[2]));
        let gmRole = message.member.roles.cache.find(role => role.name == "GM or Officer");

        if (!guildRole || !gmRole) {
            message.reply("You do not have access to add member to this guild")
            return false;
        }

        if (message.mentions.users.size == 1) {
            var guildMember = message.guild.member(message.mentions.users.first());

            if (!guildMember) {
                return false;
            }

            message.reply("Added a role to the user")

            guildMember.roles.add(guildRole)
        }

    });

    CommandSystem.addCommand(["!remove"], "GOLEMAGG_GUILD_REMOVE", "Removes user from a golemagg guild (role)", async(message, args) => {
        if (message.channel.type !== 'text') return;

        var guild = client.guilds.cache.get(message.channel.guild.id);

        if (!guild || guild.id != config.golemagg.guild_id || message.channel.id != config.golemagg.channel_id) {
            return false;
        }

        if (args.length != 3) {
            message.reply("Expected command in this format: !remove @user \"Guild Name\"")
            return false;
        }

        let guildRole = message.member.roles.cache.find(role => (role.name == "[H] " + args[2] || role.name == "[A] " + args[2]));
        let gmRole = message.member.roles.cache.find(role => role.name == "GM or Officer");

        if (!guildRole || !gmRole) {
            message.reply("You do not have access to add member to this guild")
            return false;
        }

        if (message.mentions.users.size == 1) {
            var guildMember = message.guild.member(message.mentions.users.first());

            if (!guildMember) {
                return false;
            }

            message.reply("Removed a role from the user")

            guildMember.roles.remove(guildRole)
        }

    });

    client.on('message', (message) => {
        if (message.channel.id == config.golemagg.channel_id)
            setTimeout(() => {
                if (message)
                    if (message.deletable)
                        message.delete();
            }, 3000);
    });

    return {
        name: "Golemagg Module",
        exports: {

        },
        unload: async() => {

            return true;
        },
    }
}

module.exports = {
    module: moduleFunction,
    requires: ["CMD.JS"],
    code: "GOLEMAGG.JS",
}