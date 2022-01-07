const { Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "status",
    description: "Displays status of client.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const Response = new MessageEmbed()
            .setColor("AQUA")
            .setDescription(`**Client**: \`✅ ONLINE\` - \`${client.ws.ping}ms\`\n **Uptime**: <t:${parseInt(client.readyTimestamp / 1000)}:R>\n`)
    
        interaction.reply({ embeds: [Response] });

    }
}
