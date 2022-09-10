module.exports = {
    name: "status",
    description: "Displays status of client.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
        await utils.user.pause(false);
        if(interaction.user.id != '184717700239589377')
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setDescription(`You do not have permission to use this command.`)] })
                        .catch((e) => utils.consola.error(e));

        return interaction.editReply({ embeds: [
            new utils.embed(interaction, utils.user)
                .setDescription(`**Client**: \`✅ ONLINE\` - \`${utils.client.ws.ping}ms\`\n **Uptime**: <t:${parseInt(utils.client.readyTimestamp / 1000)}:R>\n`)] })
                    .catch((e) => utils.consola.error(e));

    }
}
