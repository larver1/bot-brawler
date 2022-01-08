const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const dbAccess = require("../../Database/dbAccess.js");
const sampleEmbed = require("../../Helpers/sampleEmbed.js");
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

            if(command.name != "register") {
                const user = await dbAccess.findUser(interaction);
                //User can only use commands if they are registered to DB
                if(!user) {
                    return;
                }
            }

            //Bot respond with "loading" state
            await interaction.deferReply().catch(e => {console.log(e)});

            //Pass execution utilities to command
            try {
                await command.execute(interaction, {
                    client: client,
                    db: dbAccess,
                    consola: consola,
                    embed: sampleEmbed
                });
            } catch(e) {
                consola.error(e);
                return interaction.editReply({ embeds: [
                    new sampleEmbed(interaction).setDescription(`__❌An error has occurred!__\n${e}`)], ephemeral: true})
                        .catch((e2) => consola.error(e2));   
            };

            consola.info(`${interaction.user.tag} performed ${command.name}.`);

        }
    }
}