const Sequelize = require('sequelize');
const { dbName, dbUser, dbPass } = require('../config.json');
const fs = require('fs');
const { UUIDV4 } = require('sequelize');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json'));
const { v4: uuidv4 } = require('uuid');

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false
});

var CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
require('./models/Users')(sequelize, Sequelize.DataTypes);
require('./models/UserItems')(sequelize, Sequelize.DataTypes);
require('./models/Messages')(sequelize, Sequelize.DataTypes);
require('./models/Bots')(sequelize, Sequelize.DataTypes);
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
	for(const bot of bots) {
		await BotStats.upsert({
			bot_id: uuidv4(),
			bot_type: bot.name,
			num_exists: 0,
			num_alive: 0,
			wins: 0,
			losses: 0
		})
	}

	console.log('Database synced');
	sequelize.close();
}).catch(console.error);