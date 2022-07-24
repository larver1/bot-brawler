const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { dbName, dbUser, dbPass } = require('../config.json');
const consola = require("consola");

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
const Messages = require('./models/Messages.js')(sequelize, Sequelize.DataTypes);
const Bots = require('./models/Bots.js')(sequelize, Sequelize.DataTypes);
const BotStats = require('./models/BotStats.js')(sequelize, Sequelize.DataTypes);
const Market = require('./models/Market.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Users.prototype.pause = async function(value) {
	this.paused = value;
	this.changed("paused", true);
	return this.save();
};

Users.prototype.addItem = async function(item, freq) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem) {
		userItem.amount += freq;
		return userItem.save();
	}

	return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: freq});
};

Users.prototype.removeItem = async function(item, freq) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem && userItem.amount > 0) {
		if(!freq) userItem.amount -= 1;
		else userItem.amount -= freq;
		return userItem.save();
	} else {
		return null;
	}

};

Users.prototype.setItem = async function(item, freq) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});

	if (userItem && userItem.amount) {
		userItem.amount = freq;
		return userItem.save();
	} else {
		return null;
	}

};

Users.prototype.getItems = function() {
	return UserItems.findAll({
		where: { user_id: this.user_id },
		include: ['item'],
	});
};

Users.prototype.getItem = function(item) {
	return UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});
};

Users.prototype.getIncomingMessages = function() {
	return Messages.findAll({
		where: { recipient_username: this.username },
	});
};

Users.prototype.getOutgoingMessages = function() {
	return Messages.findAll({
		where: { sender_username: this.username },
	});
};

Users.prototype.createMessage = async function(message) {
	return Messages.create({ 
		message_id: uuidv4(), 
		sender_username: this.username, 
		recipient_username: message.recipient_username, 
		message_type: message.message_type, 
		message_content: message.message_content,
		message_number: message.message_number
	});
};

Users.prototype.removeMessage = async function(message) {
	const userMessage = await Messages.findOne({
		where: { 
			sender_username: this.username, 
			recipient_username: message.recipient_username, 
			message_id: message.message_id,
			message_number: message.message_number
		},
	});

	if(userMessage)
		userMessage.destroy();
	else
		consola.error(`Message ${message.message_id} passed to dbObjects.removeMessage() is invalid.`);

};

Users.prototype.getBots = async function() {
	return Bots.findAll({ 
		where: { owner_username: this.username }
	});
}

Users.prototype.findBot = async function(bot) {
	return Bots.findOne({ 
		where: { owner_username: this.username, bot_id: bot.id }
	});
}

Users.prototype.addToMarket = async function(bot, price) {
	return Market.create({ 
		bot_id: bot.botObj.bot_id,
		colour: bot.findColour().name,
		seller_username: this.username,
		selling_amount: price
	});
};

Users.prototype.removeFromMarket = async function(bot) {
	const userBot = await Market.findOne({
		where: { bot_id: bot.botObj.bot_id },
	});

	if(userBot)
		userBot.destroy();
	else
		consola.error(`Bot ${bot.botObj.bot_id} passed to dbObjects.removeFromMarket() is invalid.`);

};

Users.prototype.createBot = async function(bot) {
	return Bots.create({ 
		bot_id: bot.bot_id, 
		bot_type: bot.bot_type, 
		model_no: bot.model_no, 
		owner_username: bot.owner_username, 
		owner_original_username: bot.owner_original_username, 
		exp: bot.exp, 
		alive: bot.alive, 
		powerBoost: bot.powerBoost, 
		lifespanBoost: bot.lifespanBoost, 
		viralBoost: bot.viralBoost, 
		firewallBoost: bot.firewallBoost, 
		goldPlated: bot.goldPlated, 
		extras: bot.extras, 
		isSelling: bot.isSelling, 
		item: bot.item 
	});
};

Users.prototype.removeBot = async function(bot) {
	const userBot = await Bots.findOne({
		where: { bot_id: bot.id },
	});

	if(userBot)
		userBot.destroy();
	else
		consola.error(`Bot ${bot.id} passed to dbObjects.removeBot() is invalid.`);

};

module.exports = { Users, CurrencyShop, UserItems, Messages, Bots, BotStats, Market };