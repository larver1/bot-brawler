const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");
const { Users } = require('../Database/dbObjects');

module.exports = class ErrorHandler
{

    static async findUser(interaction, differentID) {
		let idToFind = interaction.user.id;
		if(differentID) idToFind = differentID;
		const user = await Users.findOne({ where: { user_id: idToFind } });
		if(!user) {
			let err = new Error(`\`${interaction.user.tag}\`||(${idToFind})|| does not have a user account.${!differentID ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
			await ErrorHandler.info(interaction, err);
		}

		return user;
    }

    static async handle(interaction, error) {
        
        let user;
        if((user = await this.findUser(interaction))) {
            await user.pause(false);
        }

        consola.error(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`❌ An error has occurred!`)
                    .setDescription(error.message )], components: [], files: [], content: ' ', ephemeral: true})
                        .catch((e) => consola.error(e));
    }

    static async info(interaction, error) {
        
        let user;
        if((user = await this.findUser(interaction))) {
            await user.pause(false);
        }

        consola.warn(error);
        return interaction.editReply({ 
            embeds: [
                new sampleEmbed(interaction)
                    .setTitle(`⚠️ Information`)
                    .setDescription(error.message)], components: [], files: [], content: ' ', ephemeral: true})
                        .catch((e) => consola.error(e));
    }

}
