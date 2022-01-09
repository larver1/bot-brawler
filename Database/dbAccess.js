const { Users, CurrencyShop } = require('./dbObjects');
const fs = require('fs');
const consola = require("consola");
const sampleEmbed = require("../Helpers/sampleEmbed.js");
const ErrorHandler = require("../Helpers/ErrorHandler.js");

module.exports = class dbAccess
{
    static async findUser(interaction, differentID) {
		let idToFind = interaction.user.id;
		if(differentID) idToFind = differentID;
		const user = await Users.findOne({ where: { user_id: idToFind } });
		if(!user) {
			let err = new Error(`\`${interaction.user.tag}\`||(${idToFind})|| does not have a user account.${!differentID ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
			await ErrorHandler.handle(interaction, err);
		}

		return user;
    }

	static async findUsername(interaction, username) {
		const user = await Users.findOne({ where: { username: username } });
		if(!user) {
			let err = new Error(`An account with the username \`${username}\` does not exist.`);
			await ErrorHandler.handle(interaction, err);
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
				await ErrorHandler.handle(interaction, err);
				break;
		}

	}

	static async add(interaction, type, toAdd, differentID) {
		const user = await this.findUser(interaction, differentID);

		if(!user)
			return;

		switch(type) {
			case "friend":
				//You can't add the same friend more than once
				if(user.friends.includes(toAdd + "|")) {
					let err = new Error(`Friend ${toAdd} already added called on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.friends += (toAdd + "|");
				break;
			case "privacy":
				//Privacy setting can only have four distinct values, or its erroneous
				if(!["public", "moderate", "private", "locked"].includes(toAdd)) {
					let err = new Error(`Tried to set invalid privacy setting ${toAdd} on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.privacy = toAdd;
				break;
			default:
				let err = new Error(`Invalid type '${type}' called on add()`);
				await ErrorHandler.handle(interaction, err);
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
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.friends = user.friends.replace((toRemove + "|"), "");
				break;
			default:
				let err = new Error(`Invalid type '${type}' called on remove()`);
				await ErrorHandler.handle(interaction, err);
				return false;
		}

		user.save();
		return true;

	}
	
};


