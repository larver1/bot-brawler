const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const dbAccess = require("../../Database/dbAccess.js");
const dbBots = require("../../Database/dbBots.js");
const sampleEmbed = require("../../Helpers/sampleEmbed.js");
const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const Messenger = require("../../Helpers/Messenger.js");
const Card = require("../../Helpers/Card.js");

const consola = require("consola");

module.exports = {
    name: "interactionCreate",
    /**
     * Handle and execute a new interaction
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
		if(interaction.user.bot) return;
        if(interaction.isCommand() || interaction.isContextMenu()) {
            const command = client.commands.get(interaction.commandName);

            //If the command couldn't be found
            if(!command)
                return interaction.reply({ embeds: [
                    new sampleEmbed(interaction)
                        .setDescription("❌ An error occured while running this command.\nThe command couldn't be found!")
                ]}) && client.commands.delete(interaction.commandName);

            //Bot respond with "loading" state
            await interaction.deferReply().catch(e => {console.log(e)});
            let user;

            if(command.name != "register") {
                user = await dbAccess.findUser(interaction);
                //User can only use commands if they are registered to DB
                if(!user) {
                    return;
                }
            }

            //Pass execution utilities to command
            try {
                await command.execute(interaction, {
                    client: client,
                    db: dbAccess,
                    dbBots: dbBots,
                    consola: consola,
                    embed: sampleEmbed,
                    handler: ErrorHandler,
                    messenger: Messenger,
                    card: Card,
                    user: user,
                });
            } catch(e) {
                await ErrorHandler.handle(interaction, e);  
            };

            consola.info(`${interaction.user.tag} performed ${command.name}.`);

        }
    }
}