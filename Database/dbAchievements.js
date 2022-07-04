const { Users } = require('./dbObjects');
const ErrorHandler = require("../Helpers/ErrorHandler.js");
const fs = require('fs');
const achievementData = JSON.parse(fs.readFileSync('./Data/Achievements/achievementsData.json'));


module.exports = class dbAchievements
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

	static async editAchievement(interaction, username, achievementName, value) {
		const user = await this.findUser(interaction);
		let i, j = 0;

		if(!user)
			return;

		// Find the achievement name
		for(i = 0; i < achievementData.length; i++) {
			if(achievementData[i].name == achievementName) {
				// For every entry in the chosen achievement
				for(j = 0; j < user.achievements[i].length; j++) {
					// Apply new value based on type
					switch(typeof value) {
						case "number":
							user.achievements[i][j].intProgress = value;
							break;
						case "string":
							user.achievements[i][j].stringProgress = value;
							break;
						case "object":
							user.achievements[i][j].arrayProgress = value;
							break;
						default:
							break;
					}

				}

				break;
			}
		}

		user.changed("achievements", true);
		await user.save();
	}

	static async findAchievement(interaction, username, achievementName) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		for(let i = 0; i < achievementData.length; i++) {
			if(achievementData[i].name == achievementName) {
				return user.achievements[i];
			}
		}

		return;
	}

	static async setupAchievements(interaction, username) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		let completeData = [];

		// Build template so that achievement progress can be stored
		for(const achievement of achievementData) {
			let template = [];
			for(const level of achievement.values) {
				template.push({
					stringProgress: "",
					intProgress: -1,
					arrayProgress: []
				});
			}
			completeData.push(template);
		}

		user.achievements = completeData;
		await user.save();

	}	
	
};


