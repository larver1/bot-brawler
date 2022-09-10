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
		},
		achievements: {
			type: DataTypes.JSON,
			allowNull: false
		},
		tasks: {
			type: DataTypes.JSON,
			allowNull: false
		},
		paused: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		tutorial: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		joinDate: {
			type: DataTypes.DATE,
			allowNull: false
		},
		playerLevel: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
		playerExp: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		voteStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		voteTime: {
			type: DataTypes.DATE,
			allowNull: false
		},
		icon: {
			type: DataTypes.STRING,
			defaultValue: "",
		},
		daysMember: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,		
		},
		memberType: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		extras: {
			type: DataTypes.JSON,
			allowNull: false
		},
	}, {
		timestamps: false,
	});
};