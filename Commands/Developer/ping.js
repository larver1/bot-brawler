const { CommandInteraction } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Ping Pong!",
    /**
     * @param {CommandInteraction} interaction
     */
    execute(interaction, utils) {
        interaction.editReply({ contents: "PONG" })
            .catch((e) => utils.consola.error(e));

    }
}