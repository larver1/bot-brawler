module.exports = (sequelize, DataTypes) => {
	return sequelize.define('bots', {
		bot_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		bot_type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		owner_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		owner_original_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		exp: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		alive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		powerBoost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		lifespanBoost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		viralBoost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		firewallBoost: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		goldPlated: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		extras: {
			type: DataTypes.STRING,
			allowNull: false,			
		},
		isSelling: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		item: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		timestamps: false,
	});
};