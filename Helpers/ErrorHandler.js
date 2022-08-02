const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");
const { Users } = require('../Database/dbObjects');
const shockedEmoji = `<:clunk_shocked:1003046346565107732>`;
const unamusedEmoji = `<:clunk_unamused:1000774660855705670>`;

module.exports = class ErrorHandler
{

    static async findUser(interaction, differentID) {
		let idToFind = interaction.user.id;
		if(differentID) idToFind = differentID;
		const user = await Users.findOne({ where: { user_id: idToFind } });
		if(!user) {
			let err = new Error(`\`${differentID ? differentID : interaction.user.tag}\` does not have a user account.${!differentID ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
			await ErrorHandler.info(interaction, err);
		}

		return user;
    }

    static async findOtherUser(interaction, differentUser) {
		const user = await Users.findOne({ where: { user_id: differentUser.id } });
		if(!user) {
			let err = new Error(`\`${differentUser.tag}\` does not have a user account.`);
			await ErrorHandler.info(interaction, err);
		}

		return user;
    }

    static async handle(interaction, error) {
        consola.error(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`${shockedEmoji} An error has occurred!`)
                    .setDescription(error.message )], components: [], files: [], content: ' ', ephemeral: true})
                        .catch((e) => consola.error(e));
    }

    static async info(interaction, error) {
        consola.warn(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`${unamusedEmoji} Information`)
                    .setDescription(error.message)], components: [], files: [], content: ' ', ephemeral: true})
                        .catch((e) => consola.error(e));
    }

}
