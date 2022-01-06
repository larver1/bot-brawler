const Sequelize = require('sequelize');

const { dbName, dbUser, dbPass } = require('../config.json');

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false
});

var CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
require('./models/Users')(sequelize, Sequelize.DataTypes);
require('./models/UserItems')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const shop = [
		await CurrencyShop.upsert({ name: 'Poke Ball', cost: 100, description: 'Used to catch a Common Pokémon when using `/p`, it cannot catch Pokémon of any other rarity.', section: 'ball', emoji: "<:pokeball:707675041168621688>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Great Ball', cost: 200, description: 'Used to catch a Common or Uncommon Pokémon when using `/p`, it cannot catch Pokémon of any other rarity.', section: 'ball', emoji: "<:greatball:708634408575565844>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Ultra Ball', cost: 500, description: 'Used to catch a Common, Uncommon, Rare or Super Rare Pokémon when using `/p`, it cannot catch Pokémon of any other rarity.', section: 'ball', emoji: "<:ultraball:708634408340684851>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Master Ball', cost: 10000, description: 'Used to catch a Mythical or Legendary Pokémon when using `/p`.', section: 'ball', emoji: "<:masterball:708634408265187400>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Shiny Charm', cost: 2500, description: 'Passively increases the user\'s chances of finding a shiny Pokémon. This item stays in your inventory, and cannot be used. Use `/profile` to see your shiny rate.', section: 'misc', emoji: "<:shinycharm:785837214570774548>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Technical Machine', cost: 5000, description: 'Changes the move of a Pokémon you select. To use it, do `/use technical machine pokemonname`.', section: 'voting', emoji: "<:technicalmachine:837820708561092728>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Rare Candy', cost: 5000, description: 'Can be exchanged for a candy of a specific Pokémon you select. To use it, do `/use rare candy pokemonname`.', section: 'voting', emoji: "<:rarecandy:838156106635280425>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Form Orb', cost: 1000, description: 'Look at https://serebii.net/games/forms.shtml for all available forms.',  section: 'misc', emoji: "<:formorb:805797650132631603>", minDex: 100}),
		await CurrencyShop.upsert({ name: 'Mega Stone', cost: 3000, description: 'Look at https://www.serebii.net/pokedex-xy/megaevolution.shtml for all Mega Evolutions.', section: 'misc', emoji: "<:megastone:804756852751466550>", minDex: 250}),
		await CurrencyShop.upsert({ name: 'Max Reactor', cost: 5000, description: 'Look at https://www.serebii.net/swordshield/gigantamax.shtml for all Gmax forms.', section: 'misc', emoji: "<:maxreactor:820343693076725783>", minDex: 700}),
		await CurrencyShop.upsert({ name: 'Event Pass', cost: 1000, description: 'This item can only be bought during an event. (This item is no longer usable)', section: 'event', emoji: "<:eventpass:807724453503959060>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Premier Ball', cost: 200, description: 'Used to catch any Pokémon during an event. (This item is no longer usable)', section: 'event', emoji: "<:premierball:807724046233632798>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Time Gear', cost: 5000, description: 'Reverses a Gmax/Mega/Form Pokémon back to its original state. To use it, do `/use time gear pokemonname`.', section: 'voting', emoji: "<:timegear:896707901278806026>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Golden Nugget', cost: 15000, description: 'A rare, valuable item which can be sold for a lot of money.', section: 'voting', emoji: "<:nugget:896724404493516840>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Z Machine', cost: 5000, description: 'Teaches a Z-Move to a Pokémon you select. To use it, do `/use z machine pokemonname`. Please note that only Pokémon in their original form can learn a Z-Move, unless said form has its own signature Z-Move.', section: 'voting', emoji: "<:zmachine:896732679582654516>", minDex: 0}),
		await CurrencyShop.upsert({ name: 'Halloween Candy', cost: 40, description: 'Happy Halloween!', section: 'voting', emoji: "<:halloweencandy:899343149065969665>", minDex: 0})

	];

	await Promise.all(shop);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);