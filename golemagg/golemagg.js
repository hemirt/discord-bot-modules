var moduleFunction = async(client, moduleLoader, config) => {
    if (!client)
        throw new Error("No client passed");

    console.log("[GOLEMAGG.JS] Adding commands")
    var CommandSystem = moduleLoader.getModule("CMD.JS").exports.CommandSystem;

    CommandSystem.addCommand(["!add"], "GOLEMAGG_GUILD_ADD", "Adds user to a golemagg guild (role)", async(message, args) => {
        if (message.channel.type !== 'text') return;

        var guild = client.guilds.cache.get(message.channel.guild.id);

        //todo readd middleware for guild id, channel id
        if (!guild || guild.id != config.golemagg.guild_id || message.channel.id != config.golemagg.channel_id) {
            return false;
        }

        if (args.length < 3) {
            message.reply("Expected command in this format: !add @user \"Guild Name\" or !add @user1 @user2 @user3 \"Guild Name\"")
            return false;
        }

        let guildRole = message.member.roles.cache.find(role => (role.name == "[H] " + args[args.length - 1] || role.name == "[A] " + args[args.length - 1]));
        let gmRole = message.member.roles.cache.find(role => role.name == "GM or Officer");

        if (!guildRole || !gmRole) {
            message.reply("You do not have access to add member to this guild")
            return false;
        }

        if (message.mentions.users.size > 0) {
            var roleAdded = false;
            message.mentions.users.forEach(user => {
                var guildMember = message.guild.member(user);
                var check = guildMember.roles.cache.filter(role => role.name.includes("[A]") || role.name.includes("[H]") || role.name == "GM or Officer");

                if (check.size > 0) {
                    message.reply("This user is either member of another guild or is Guild Master / Officer.")
                    return false;
                }
                if (!guildMember) {
                    return false;
                }

                guildMember.roles.add(guildRole)
                roleAdded = true;
            });


            if (roleAdded)
                message.reply("Added a role to the user(s)")
        }

    });

    CommandSystem.addCommand(["!remove"], "GOLEMAGG_GUILD_REMOVE", "Removes user from a golemagg guild (role)", async(message, args) => {
        if (message.channel.type !== 'text') return;

        var guild = client.guilds.cache.get(message.channel.guild.id);

        //todo readd middleware for guild id, channel id
        if (!guild || guild.id != config.golemagg.guild_id || message.channel.id != config.golemagg.channel_id) {
            return false;
        }

        if (args.length < 3) {
            message.reply("Expected command in this format: !remove @user \"Guild Name\" or !remove @user1 @user2 @user3 \"Guild Name\"")
            return false;
        }

        let guildRole = message.member.roles.cache.find(role => (role.name == "[H] " + args[args.length - 1] || role.name == "[A] " + args[args.length - 1]));
        let gmRole = message.member.roles.cache.find(role => role.name == "GM or Officer");

        if (!guildRole || !gmRole) {
            message.reply("You do not have access to remove member from this guild")
            return false;
        }

        if (message.mentions.users.size > 0) {
            var roleRemoved = false;
            message.mentions.users.forEach(user => {
                var guildMember = message.guild.member(user);
                let check = guildMember.roles.cache.filter(role => role.name == "GM or Officer");

                if (check.size > 0) {
                    message.reply("You cannot remove Guild Master or Officer from the guild")
                    return false;
                }

                if (!guildMember) {
                    return false;
                }

                guildMember.roles.remove(guildRole)
                roleRemoved = true;
            });

            if (roleRemoved)
                message.reply("Removed a role from the user(s)")
        }

    });

    client.on('message', (message) => {
        if (message.channel.id == config.golemagg.channel_id)
            setTimeout(() => {
                try {
                    if (message)
                        if (message.deletable)
                            message.delete();
                } catch (err) {
                    console.error(err);
                }
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
