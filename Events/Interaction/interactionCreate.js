const dbAccess = require("../../Database/dbAccess.js");
const dbBots = require("../../Database/dbBots.js");
const dbBotStats = require("../../Database/dbBotStats.js");
const sampleEmbed = require("../../Helpers/sampleEmbed.js");
const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const BotCollection = require("../../Helpers/BotCollection.js");
const Messenger = require("../../Helpers/Messenger.js");
const MessageHelpers = require("../../Helpers/MessageHelpers.js");
const dbMarket = require("../../Database/dbMarket.js");
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
            await interaction.deferReply({ ephemeral: command.hidden }).catch(e => {console.log(e)});
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
                    botCollection: BotCollection,
                    client: client,
                    db: dbAccess,
                    dbBots: dbBots,
                    dbBotStats: dbBotStats,
                    dbMarket: dbMarket,
                    consola: consola,
                    embed: sampleEmbed,
                    handler: ErrorHandler,
                    messenger: Messenger,
                    messageHelper: MessageHelpers,
                    card: Card,
                    user: user,
                });
            } catch(e) {
                await ErrorHandler.handle(interaction, e);  
            }

            //Update time since last command was performed
            if(user)
                await dbAccess.add(interaction, "lastCommand");
            consola.info(`${interaction.user.tag} performed ${command.name}.`);

        }
    }
}