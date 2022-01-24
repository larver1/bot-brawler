module.exports = (sequelize, DataTypes) => {
	return sequelize.define('currency_shop', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		cost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		section: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		emoji: {
			type: DataTypes.STRING,
		allowNull: false,
		},
		minAchievements: {
			type: DataTypes.INTEGER,
		allowNull: false,
		}
	}, {
		timestamps: false,
	});
};