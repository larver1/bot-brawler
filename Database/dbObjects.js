const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { dbName, dbUser, dbPass } = require('../config.json');

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    dialect: 'mysql',  
	logging: false
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
const Messages = require('./models/Messages.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

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
		where: { recipient_id: this.user_id },
	});
};

Users.prototype.getOutgoingMessages = function() {
	return Messages.findAll({
		where: { sender_id: this.user_id },
	});
};

Users.prototype.createMessage = async function(message) {

	return Messages.create({ message_id: uuidv4(), sender_id: this.user_id, recipient_id: message.recipient_id, message_type: message.message_type, message_content: message.message_content });
};

Users.prototype.removeMessage = async function(message) {
	const userItem = await Messages.findOne({
		where: { sender_id: this.user_id, recipient_id: message.recipient_id, message_id: message.message_id },
	});

	userItem.destroy();

};

module.exports = { Users, CurrencyShop, UserItems, Messages };