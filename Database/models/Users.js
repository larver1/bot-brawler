module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		username: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		balance: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		energy: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		exp: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		friends: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		privacy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		daily: {
			type: DataTypes.DATE,
			allowNull: false
		},
		spawn: {
			type: DataTypes.DATE,
			allowNull: false
		},
		lastCommand: {
			type: DataTypes.DATE,
			allowNull: false
		},
		isBot: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		currentChallenge: {
			type: DataTypes.TEXT('long'),
			allowNull: false
		},
		challengesComplete: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		minigame: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}, {
		timestamps: false,
	});
};