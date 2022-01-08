const { Users, CurrencyShop } = require('./dbObjects');
const fs = require('fs');
const consola = require("consola");
const sampleEmbed = require("../Helpers/sampleEmbed.js");
const ErrorHandler = require("../Helpers/ErrorHandler.js");

module.exports = class dbAccess
{
    static async findUser(interaction, id) {
		let idToFind = interaction.user.id;
		if(id) idToFind = id;
		const user = await Users.findOne({ where: { user_id: idToFind } });
		if(!user) {
			let err = new Error(`\`${interaction.user.tag}(${idToFind})\` does not have a user account.${!id ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
			ErrorHandler.handle(interaction, err);
		}

		return user;
    }

	static async findUsername(interaction, username) {
		const user = await Users.findOne({ where: { username: username } });
		if(!user) {
			let err = new Error(`An account with the username \`${username}\` does not exist.`);
			ErrorHandler.handle(interaction, err);
		}

		return user;
    }

	static async findFriend(interaction, username) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		//Put friend names in array
		let friendList = user.friends.split("|").slice(1, -1);
		let found = false;

		if(!friendList || !friendList.length)
			return found;

		//Search for matching friend name
		for(const friend of friendList) {
			if(friend.toLowerCase() == username.toLowerCase()) {
				found = true;
				break;
			}	
		}

		return found;
	}

    static async getData(interaction, type) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		switch(type) {
			case "username":
				return user.username;
			default:
				let err = new Error(`Invalid type '${type}' called on getData()`);
				ErrorHandler.handle(interaction, err);
				break;
		}

	}

	static async add(interaction, type, toAdd) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		switch(type) {
			case "friend":
				user.friends += (toAdd + "|");
				break;
			default:
				let err = new Error(`Invalid type '${type}' called on add()`);
				ErrorHandler.handle(interaction, err);
				return false;
		}

		user.save();
		return true;

	}

	static async remove(interaction, type, toRemove) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		switch(type) {
			case "friend":
				//If friend isn't there
				if(!user.friends.includes(toRemove)) {
					let err = new Error(`Invalid value '${toRemove}' called on remove()`);
					ErrorHandler.handle(interaction, err);
					return false;
				}
				user.friends = user.friends.replace((toRemove + "|"), "");
				break;
			default:
				let err = new Error(`Invalid type '${type}' called on remove()`);
				ErrorHandler.handle(interaction, err);
				return false;
		}

		user.save();
		return true;

	}
	
};


