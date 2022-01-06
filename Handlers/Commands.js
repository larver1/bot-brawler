const { Perms } = require("../Validation/Permissions");
const { Client } = require("discord.js");
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");
const consola = require("consola");

/**
 * @param {Client} client
 */
module.exports = async (client) => {
    const Table = new Ascii("Command Loaded");

    CommandsArray = [];

    (await PG(`${process.cwd()}/Commands/*/*.js`)).map(async (file) => {
        const command = require(file);

        //Command checks
        if(!command.name)
            return Table.addRow(file.split("/")[7], "❌ FAILED", "Missing a name.");

        if(!command.description && command.type != "USER")
            return Table.addRow(command.name, "❌ FAILED", "Missing a description.");

        if(command.permission){
            if(Perms.includes(command.permission))
                command.defaultPermission = false;
            else
                return Table.addRow(command.name, "❌ FAILED", "Permission is invalid");
        }

        //Add valid command to array
        client.commands.set(command.name, command);
        CommandsArray.push(command);

        //Command passed checks
        await Table.addRow(command.name, "✅ SUCCESSFUL");

    });

    consola.info(Table.toString());

    //Permissions check

    client.on("ready", async () => {
        const MainGuild = await client.guilds.cache.get("900112392975949824");
        MainGuild.commands.set(CommandsArray).then(async (command) => {
            const Roles = (commandName) => {
                const cmdPerms = CommandsArray.find((c) => c.name === commandName).permission;
                if(!cmdPerms) 
                    return null;

                //Confirm if the role has permission needed
                return MainGuild.roles.cache.filter((r) => r.permissions.has(cmdPerms));
            }

            //Gets every permission from every role
            const fullPermissions = command.reduce((accumulator, r) => {
                const roles = Roles(r.name);
                if(!roles) 
                    return accumulator;

                const permissions = roles.reduce((a, r) => {
                    return [...a, {id: r.id, type: "ROLE", permission: true}]
                }, []);

                return [...accumulator, {id: r.id, permissions}]
            }, []);

            await MainGuild.commands.permissions.set({ fullPermissions });

        });

    });
}