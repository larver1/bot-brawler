const { Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "status",
    description: "Displays status of client.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, exec) {
        return interaction.editReply({ embeds: [
            new exec.embed(interaction)
                .setDescription(`**Client**: \`✅ ONLINE\` - \`${exec.client.ws.ping}ms\`\n **Uptime**: <t:${parseInt(exec.client.readyTimestamp / 1000)}:R>\n`)] });

    }
}
