module.exports = {
    name: "unpause",
    description: "Unpause yourself out of commands.",
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
        await utils.user.pause(false);
        return interaction.editReply({ content: `You may use commands again.`})
            .catch((e) => utils.consola.error(e));

    }
}
