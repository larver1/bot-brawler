const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const { dbAccess } = require("../../dbAccess.js");

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        console.log(dbAccess);
        if(interaction.isCommand() || interaction.isContextMenu()) {
            const command = client.commands.get(interaction.commandName);
            if(!command)
                return interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("❌ An error occured while running this command.")
                ]}) && client.commands.delete(interaction.commandName);

            command.execute(interaction, client, dbAccess);

        }
    }
}