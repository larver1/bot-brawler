const { MessageEmbed } = require('discord.js');

module.exports = class sampleEmbed extends MessageEmbed
{
	constructor(interaction, user, otherAvatar, otherUser)
	{	

		let clientUser = otherUser ? otherUser : interaction.user;

		super();
		this.setTimestamp();
		this.setFooter({ text: 'Bot Brawler' });
		this.setColor(`DARK_GOLD`);
		this.setAuthor({ 
			name: user ? user.username : clientUser.tag, 
			iconURL: otherAvatar ? otherAvatar : clientUser.avatarURL({ dynamic: true, size: 512 }) 
		});
	}

}
