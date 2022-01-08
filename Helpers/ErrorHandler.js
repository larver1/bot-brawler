const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");

module.exports = class ErrorHandler
{
    static async handle(interaction, error) {
        consola.error(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction).setDescription(`__❌An error has occurred!__\n${error}`)], ephemeral: true})
                    .catch((e) => consola.error(e));
    }

}
