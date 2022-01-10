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
		friends: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		privacy: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		timestamps: false,
	});
};