module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		box: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
		},
		rolls: {
			type: DataTypes.INTEGER,
			defaultValue: 10,
			allowNull: false,
		},
		drops: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allowNull: false,
		},
		team: {
			type: DataTypes.TEXT,
			defaultValue: "",
			allowNull: false,
		},
		pokedex: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
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
		leaguesComplete: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		voteStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		quests: {
			type: DataTypes.STRING,
			defaultValue: "",
			allowNull: false,
		},
		gymBadges: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		memberType: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		location: {
			type: DataTypes.STRING,
			defaultValue: "",
			allowNull: false,
		},
		candy: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
		},
		eggs: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
		},
		server: {
			type: DataTypes.STRING,
			defaultValue: "",
			allowNull: false,
		},
		paused: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		pauseTime: {
			type: DataTypes.DATE,
		},
		daysMember: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,		
		},
		forTrade: {
			type: DataTypes.TEXT,
			defaultValue: "",
			allowNull: false,
		},
		tasksComplete: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		taskStatus: {
			type: DataTypes.STRING,
			defaultValue: "",
			allowNull: false,
		},
		taskProgress: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		wins: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		losses: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		event: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		timeSinceLastVote: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		}
	}, {
		timestamps: false,
	});
};