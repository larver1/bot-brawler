module.exports = (sequelize, DataTypes) => {
	return sequelize.define('market', {
		bot_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		colour: {
			type: DataTypes.STRING,
			primaryKey: false,
		},
		seller_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		selling_amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};