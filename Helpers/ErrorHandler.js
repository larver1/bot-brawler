const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");

module.exports = class ErrorHandler
{
    static async handle(interaction, error) {
        consola.error(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`❌ An error has occurred!`)
                    .setDescription(error.message )], ephemeral: true})
                        .catch((e) => consola.error(e));
    }

    static async info(interaction, error) {
        consola.warn(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`⚠️ Information`)
                    .setDescription(error.message)], ephemeral: true})
                        .catch((e) => consola.error(e));
    }

}
