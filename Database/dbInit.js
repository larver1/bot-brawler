const Sequelize = require('sequelize');

const { dbName, dbUser, dbPass } = require('../config.json');

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false
});

var CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
require('./models/Users')(sequelize, Sequelize.DataTypes);
require('./models/UserItems')(sequelize, Sequelize.DataTypes);
require('./models/Messages')(sequelize, Sequelize.DataTypes);
require('./models/Bots')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const shop = [
		await CurrencyShop.upsert({ name: 'Balanced Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s stats evenly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 }),
		await CurrencyShop.upsert({ name: 'Power Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s power stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 }),
		await CurrencyShop.upsert({ name: 'Lifespan Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s lifespan stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 }),
		await CurrencyShop.upsert({ name: 'Viral Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s viral stat significantly..', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 }),
		await CurrencyShop.upsert({ name: 'Firewall Chip', cost: 250, description: 'When equipped to a bot during battle, it boosts your bot\'s firewall stat significantly.', section: 'chips', emoji: "<:pokeball:707675041168621688>", minAchievements: 0 }),

	];

	await Promise.all(shop);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);