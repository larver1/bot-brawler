const { Client, CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    /**
     * 
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

            //Check if DMs are on
            if(!interaction.user.createDM())
                return interaction.reply({ embeds: [
                    new MessageEmbed()
                        .setColor("RED")
                        .setDescription("❌ Your DMs are turned off, so the bot cannot work.")
                    ]});

            command.execute(interaction, client);

            
        }
    }
}