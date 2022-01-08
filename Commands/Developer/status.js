const { Client, MessageEmbed } = require("discord.js");

module.exports = {
    name: "status",
    description: "Displays status of client.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
        return interaction.editReply({ embeds: [
            new utils.embed(interaction)
                .setDescription(`**Client**: \`✅ ONLINE\` - \`${utils.client.ws.ping}ms\`\n **Uptime**: <t:${parseInt(utils.client.readyTimestamp / 1000)}:R>\n`)] })
                    .catch((e) => utils.consola.error(e));

    }
}
