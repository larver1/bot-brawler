const Sequelize = require('sequelize');
const { dbName, dbUser, dbPass } = require('../config.json');
const fs = require('fs');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const { v4: uuidv4 } = require('uuid');
const consola = require("consola");

const conn = {};

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false,
});

conn.sequelize = sequelize;
conn.Sequelize = Sequelize;
module.exports = conn;

var CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
require('./models/Users')(sequelize, Sequelize.DataTypes);
require('./models/UserItems')(sequelize, Sequelize.DataTypes);
require('./models/Messages')(sequelize, Sequelize.DataTypes);
require('./models/Bots')(sequelize, Sequelize.DataTypes);
require('./models/Market')(sequelize, Sequelize.DataTypes);

var BotStats = require('./models/BotStats')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {

	// Add all shop items
	await CurrencyShop.upsert({ name: 'Balanced Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s stats evenly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 });
	await CurrencyShop.upsert({ name: 'Power Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s power stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 });
	await CurrencyShop.upsert({ name: 'Lifespan Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s lifespan stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 });
	await CurrencyShop.upsert({ name: 'Viral Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s viral stat significantly..', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 });
	await CurrencyShop.upsert({ name: 'Firewall Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s firewall stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 });

	// Add all bot stats
	if(force) {
		for(const bot of bots) {
			try {
				await BotStats.upsert({
					bot_type: bot.name,
					num_exists: 0,
					num_alive: 0,
					wins: 0,
					losses: 0
				})
			} catch(e) {
				consola.info(e);
			}
		}
	}

	console.log('Database synced');
}).catch(console.error);