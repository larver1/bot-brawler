module.exports = (sequelize, DataTypes) => {
	return sequelize.define('messages', {
		message_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		message_number: {
			type: DataTypes.INTEGER,
			primaryKey: false,
		},
		sender_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		recipient_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		message_type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		message_content: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
		}
	}, {
		timestamps: false,
	});
};