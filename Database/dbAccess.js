const { Users } = require('./dbObjects');
const ErrorHandler = require("../Helpers/ErrorHandler.js");
const dbAchievements = require("../Database/dbAchievements.js");
const { sequelize } = require("../Database/dbInit.js"); 

module.exports = class dbAccess
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

	static async findUsername(interaction, username) {
		const user = await Users.findOne({ where: { username: username } });
		if(!user) {
			let err = new Error(`An account with the username \`${username}\` does not exist.`);
			await ErrorHandler.info(interaction, err);
		}

		return user;
    }

	// Return true if user was successfully paused
	static async pauseUser(interaction, differentID) {
		let idToFind = interaction.user.id;
		if(differentID) 
			idToFind = differentID;
		
		const getPaused = await sequelize.transaction();

		try {

			const user = await Users.findOne(
				{ where: { user_id: idToFind } }, 
				{ transaction: getPaused });
			
			// If no user was found, cancel
			if(!user) {
				await this.add(interaction, "paused", false);
				let err = new Error(`\`${interaction.user.tag}\`||(${idToFind})|| does not have a user account.${!differentID ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
				await ErrorHandler.info(interaction, err);
				await getPaused.rollback();
				return;
			}

			// If user was already paused, cancel
			if(user.paused == true) {
				await getPaused.rollback();
				return;
			}

			// Set user to paused, save and commit transaction
			user.paused = true;
			await user.save({ transaction: getPaused });
			await getPaused.commit();
			return user;
			
		} catch (err) {
			return;
		}

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

	static getTimeSince(date) {
		let timeDiff = Math.abs(Date.now() - date);
		let decimalPoints = 0;

		let numDays = timeDiff / 8.64e7;
		let numWeeks = numDays / 7;
		let numYears = numWeeks / 52;
		let numHours = timeDiff / 36e5;
		let numMins = timeDiff / 60000;

		// Find the best format to present the time
		if(numYears < 1)
			if(numWeeks < 1)
				if(numDays < 1) 
					if(numHours < 1) 
						return `${numMins.toFixed(decimalPoints)} minutes ago`;
					else
						return `${numHours.toFixed(decimalPoints)} hours ago`;
				else
					return `${numDays.toFixed(decimalPoints)} days ago`;		
			else
				return `${numWeeks.toFixed(decimalPoints)} weeks ago`;
		else
			return `${numYears.toFixed(decimalPoints)} years ago`;

	}

    static async getData(interaction, type, differentID) {
		const user = await this.findUser(interaction, differentID);

		if(!user)
			return;

		switch(type) {
			case "friends":
				var friends = user.friends.replaceAll('|', '\n').slice(1, -1).split("\n");
				if(friends[0].length <= 0) return [];
				return friends; 
			case "username":
				return user.username;
			case "lastCommand":
				return this.getTimeSince(user.lastCommand);
			case "minigame":
				return this.getTimeSince(user.minigame);
			case "currentChallenge":
				if(!user.currentChallenge)
					return;
				return user.currentChallenge.split("|").slice(0, -1);
			default:
				var err = new Error(`Invalid type '${type}' called on getData()`);
				await ErrorHandler.handle(interaction, err);
				break;
		}

	}

	static async add(interaction, type, toAdd, differentID) {
		const user = await this.findUser(interaction, differentID);

		if(!user)
			return;

		switch(type) {
			case "lastCommand":
				user.lastCommand = Date.now();
				break;
			case "minigame":
				user.minigame = Date.now();
				break;
			case "challengesComplete":
				if(user.challengesComplete >= 5) {
					let err = new Error(`Challenges complete has already exceeded on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.challengesComplete++;
				if(user.challengesComplete == 5) {
					await dbAchievements.checkTask(interaction, user.username, "Guinea Pig");
				}
				break;
			case "currentChallenge":
				if(typeof toAdd != "string") {
					let err = new Error(`Tried to set invalid challenge ${toAdd} on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.currentChallenge = toAdd;
				break;
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
			case "energy":
				if(typeof toAdd != "number" || toAdd <= 0) {
					let err = new Error(`Tried to add invalid energy ${toAdd} on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.energy += toAdd;
				if(user.energy >= 100)
					user.energy = 100;
				break;
			case "parts":
			case "balance":
				if(typeof toAdd != "number" || toAdd <= 0) {
					let err = new Error(`Tried to add invalid money ${toAdd} on add()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.balance += toAdd;
				break;
			case "daily":
				user.daily = Date.now();
				break;
			case "paused":
				user.paused = toAdd;
				break;
			default:
				var err = new Error(`Invalid type '${type}' called on add()`);
				await ErrorHandler.handle(interaction, err);
				return false;
		}

		await user.save();
		return true;

	}

	static async remove(interaction, type, toRemove, differentID) {
		const user = await this.findUser(interaction, differentID);

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
			case "energy":
				if(typeof toRemove != "number" || toRemove < 0 || toRemove > user.energy) {
					let err = new Error(`Tried to remove invalid energy ${toRemove} on remove()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.energy -= toRemove;
				
				if(user.energy <= 0)
					await dbAchievements.checkTask(interaction, user.username, "Depleted");

				break;
			case "challengesComplete":
				user.challengesComplete = 0;
				break;
			case "parts":
			case "balance":
				if(typeof toRemove != "number" || toRemove < 0 || toRemove > user.balance) {
					let err = new Error(`Invalid value '${toRemove}' called on remove()`);
					await ErrorHandler.handle(interaction, err);
					return false;
				}
				user.balance -= toRemove;
				break;
			default:
				var err = new Error(`Invalid type '${type}' called on remove()`);
				await ErrorHandler.handle(interaction, err);
				return false;
		}

		await user.save();
		return true;

	}
	
};


