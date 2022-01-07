const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const dbAccess = require("../../Database/dbAccess.js");
const consola = require("consola");

module.exports = {
    name: "interactionCreate",
    /**
     * Handle and execute a new interaction
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        if(interaction.isCommand() || interaction.isContextMenu()) {
            const command = client.commands.get(interaction.commandName);
            if(!command)
                return interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("❌ An error occured while running this command.")
                ]}) && client.commands.delete(interaction.commandName);

            if(command.name != "register") {
                const user = await dbAccess.findUser(interaction);
                //User can only use commands if they are registered to DB
                if(!user) {
                    return;
                }
            }

            //Pass execution object to command
            command.execute(interaction, {
                client: client,
                db: dbAccess,
                consola: consola
            });

        }
    }
}