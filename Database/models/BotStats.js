module.exports = (sequelize, DataTypes) => {
	return sequelize.define('bot_stats', {
		bot_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		bot_type: {
			type: DataTypes.STRING,
			allowNull: false,
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