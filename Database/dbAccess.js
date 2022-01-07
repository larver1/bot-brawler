const { Users, CurrencyShop } = require('./dbObjects');
const fs = require('fs');
const consola = require("consola");

module.exports = class dbAccess
{
    static async findUser(interaction) {
		const user = await Users.findOne({ where: { user_id: interaction.user.id } });
		if(!user) {
			let err = new Error(`${interaction.user.tag}(${interaction.user.id}) does not have a user account.\nIf this is your first time using Bot Brawler, please use \`/register\`.`);
			consola.error(err);
			await interaction.reply({ content: `__❌An error has occurred!__\n${err}`, ephemeral: true});
		}

		return user;
    }

    static async getData(id, type) {
		const user = await this.findUser(id);

		if(!user)
			return;

		switch(type) {
			case "username":
				return user.username;
			default:
				console.log("Not a valid type specified. " + type);
				break;
		}

	}
	
};


