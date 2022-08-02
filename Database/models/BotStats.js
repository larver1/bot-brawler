module.exports = (sequelize, DataTypes) => {
	return sequelize.define('bot_stats', {
		bot_type: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		num_exists: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		num_alive: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		wins: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		losses: {
			type: DataTypes.INTEGER,
			allowNull: false,
		}
	}, {
		timestamps: false,
	});
};