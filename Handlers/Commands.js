const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");
const consola = require("consola");
const { guildId, otherGuildId, officialGuildId } = require("../config.json");

/**
 * @param {Client} client
 */
module.exports = async (client) => {
    const Table = new Ascii("Command Loaded");

    let CommandsArray = [];

    (await PG(`${process.cwd()}/Commands/*/*.js`)).map(async (file) => {
        const command = require(file);
        let path = file.split("/");
        command.section = path[path.length - 2];
        
        //Command checks
        if(!command.name)
            return Table.addRow(file.split("/")[7], "❌ FAILED", "Missing a name.");

        if(!command.description && command.type != "USER")
            return Table.addRow(command.name, "❌ FAILED", "Missing a description.");

        //Add valid command to array
        client.commands.set(command.name, command);
        CommandsArray.push(command);
        
        // If you want to delete all commands
        //CommandsArray = [];

        //Command passed checks
        await Table.addRow(command.name, "✅ SUCCESSFUL");

    });

    consola.info(Table.toString());

    //Permissions check

    client.on("ready", async () => {
        
        /*
        MainGuild = test server
        client.application = global
        */
        //const MainGuild = await client.guilds.cache.get(officialGuildId);
        client.application.commands.set(CommandsArray);

    });
}