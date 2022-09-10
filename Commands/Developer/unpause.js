module.exports = {
    name: "unpause",
    description: "Unpause yourself out of commands.",
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

        return interaction.editReply({ content: `You may use commands again.`})
            .catch((e) => utils.consola.error(e));

    }
}
