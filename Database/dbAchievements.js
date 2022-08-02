const { Users } = require('./dbObjects');
const ErrorHandler = require("../Helpers/ErrorHandler.js");
const Messenger = require("../Helpers/Messenger.js");
const fs = require('fs');
const achievementData = JSON.parse(fs.readFileSync('./Data/Achievements/achievementsData.json'));
const taskData = JSON.parse(fs.readFileSync('./Data/Achievements/taskData.json'));
const consola = require("consola");
const machinePartEmoji = "<:machine_parts:992728693799669801>";

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

	static async editAchievement(interaction, username, achievementName, value, achievementIndex) {
		let user;
		if(username)
			user = await this.findUsername(interaction, username);
		else
			user = await this.findUser(interaction);

		let i, j = 0;

		if(!user || user.isBot)
			return false;

		// Find the achievement name
		for(i = 0; i < achievementData.length; i++) {
			if(achievementData[i].name == achievementName) {
				// For every entry in the chosen achievement
				for(j = 0; j < user.achievements[i].length; j++) {
					// Apply new value based on type
					if(achievementIndex)
						j = achievementIndex - 1;
					else if(user.achievements[i][j].completed == "true")
						continue;

					switch(achievementData[i].type) {
						case "number":
							user.achievements[i][j].intProgress += value;
							break;
						case "string":
							// Value can't already exist for it to work
							if(!user.achievements[i][j].stringProgress.includes(`${value}|`)) {
								user.achievements[i][j].stringProgress += `${value}|`;
								user.achievements[i][j].intProgress += 1;
							}
							break;
						case "object":
							if(achievementData[i].values[j][2].includes(value) && !user.achievements[i][j].arrayProgress.includes(value)) {
								user.achievements[i][j].arrayProgress.push(value);
								user.achievements[i][j].intProgress += 1;
							}
							break;
						default:
							break;
					}

					// If achievement is completed, send DM to user
					if(!user.achievements[i][j].completed && achievementData[i].values[j][0] == user.achievements[i][j].intProgress) {
						user.achievements[i][j].completed = "true";
						await Messenger.sendDM(interaction, interaction.client, user, 
							`🎉 You have unlocked the achievement: \`${achievementName}:${j + 1}\`\n\nYour reward: \`x${achievementData[i].rewards[j]}\` ${machinePartEmoji} Machine Parts!`);

						// Add money to user
						user.balance += achievementData[i].rewards[j];
						user.changed("balance", true);
						await user.save();

					}

					consola.info(`achievement updated: ${achievementName}:${achievementIndex}`);

					if(achievementIndex)
						break;
				}

				break;
			}
		}

		user.changed("achievements", true);
		await user.save();
		return true;
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

	static async setupAchievements(interaction) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		let completeData = [];

		// Build template so that achievement progress can be stored
		for(const achievement of achievementData) {
			let template = [];
			for(let i = 0; i < achievement.values.length; i++) {
				template.push({
					stringProgress: "",
					intProgress: 0,
					arrayProgress: []
				});
			}
			completeData.push(template);
		}

		user.achievements = completeData;
		await user.save();
		return true;

	}

	static async clearTasks(interaction) {
		const user = await this.findUser(interaction);
		if(!user)
			return;

		user.tasks = [{}];
		await user.save();
		return true;
	}

	static async checkTask(interaction, username, taskName) {
		let user;
		if(username)
			user = await this.findUsername(interaction, username);
		else
			user = await this.findUser(interaction);
		if(!user || user.tasks == [{}])
			return;

		for(let i = 0; i < user.tasks.length; i++) {
			if(user.tasks[i].name == taskName) {
				user.tasks[i].completed = "true";
			}
		}

		user.changed("tasks", true);
		await user.save();
		return true;
	}

	static async setupTasks(interaction) {
		const user = await this.findUser(interaction);

		if(!user)
			return;

		let tasks = [];
		let chosen = [];

		// Build template so that task progress can be stored
		for(let i = 0; i < 3; i++){
			let newTask;
			do {
				newTask = taskData[Math.floor(Math.random() * taskData.length)];
			} while(chosen.includes(newTask.name));

			chosen.push(newTask.name);
			tasks.push({
				"name": newTask.name,
				"description": newTask.description,
				"completed": "false"
			});
		}

		user.tasks = tasks;
		await user.save();
		return true;

	}
	
};


