const dbAccess = require("../../Database/dbAccess.js");
const dbAchievements = require("../../Database/dbAchievements.js");
const dbBots = require("../../Database/dbBots.js");
const dbBotStats = require("../../Database/dbBotStats.js");
const sampleEmbed = require("../../Helpers/sampleEmbed.js");
const ErrorHandler = require("../../Helpers/ErrorHandler.js");
const BotCollection = require("../../Helpers/BotCollection.js");
const Messenger = require("../../Helpers/Messenger.js");
const MessageHelpers = require("../../Helpers/MessageHelpers.js");
const dbMarket = require("../../Database/dbMarket.js");
const Card = require("../../Helpers/Card.js");
const FileReadWrite = require("../../Helpers/FileReadWrite.js");
const consola = require("consola");
const messageHelper = new MessageHelpers();
const { debug } = require("../../config.json");

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

            // If the command couldn't be found
            if(!command)
                return interaction.reply({ embeds: [
                    new sampleEmbed(interaction)
                        .setDescription("❌ An error occured while running this command.\nThe command couldn't be found!")
                ]}) && client.commands.delete(interaction.commandName);

            // Bot respond with "loading" state
            await interaction.deferReply({ ephemeral: command.hidden }).catch(e => {consola.error(e)});
             
            // Dev only
            /*
            if(interaction.user.id != "184717700239589377" && interaction.user.id != "717417993809690666") {
                await interaction.editReply({ content: `The bot is not currently open for testing :(`})
                    .catch((e) => consola.error(e));
                return;
            }
            */

            let user, userFile;

            // Find the user and pause them
            if(command.name != "register") {
                user = await dbAccess.findUser(interaction);
                if(!user)
                    return;

                if(command.name != "unpause") {
                    if(!await dbAccess.pauseUser(interaction, interaction.user.id)) {
                        let minutesSinceLastCommand = (Date.now() - user.lastCommand) / 60000;
                        if(minutesSinceLastCommand >= 5) {
                            await user.pause(false);
                        }

                        return interaction.editReply({ content: `Please wait until your previous command is finished.` }).catch(e => {consola.error(e)});
                    }
                } 
           
                userFile = new FileReadWrite(`./UserLogs/${user.username}.txt`);
            }

            // Pass execution utilities to command
            try {
                await command.execute(interaction, {
                    botCollection: BotCollection,
                    client: client,
                    db: dbAccess,
                    dbBots: dbBots,
                    dbAchievements: dbAchievements,
                    dbBotStats: dbBotStats,
                    dbMarket: dbMarket,
                    consola: consola,
                    embed: sampleEmbed,
                    handler: ErrorHandler,
                    messenger: Messenger,
                    messageHelper: messageHelper,
                    card: Card,
                    user: user,
                    userFile: userFile,
                    debug: debug
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