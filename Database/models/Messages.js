module.exports = (sequelize, DataTypes) => {
	return sequelize.define('messages', {
		message_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		sender_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		recipient_id: {
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