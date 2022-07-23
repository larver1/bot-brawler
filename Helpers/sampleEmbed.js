const { MessageEmbed } = require('discord.js');

module.exports = class sampleEmbed extends MessageEmbed
{
	constructor(interaction, user, otherAvatar)
	{	
		super();
		this.setTimestamp();
		this.setColor(`DARK_GOLD`);
		this.setFooter({ text: 'Bot Brawler' });
		this.setAuthor({ 
			name: user ? user.username : interaction.user.tag, 
			iconURL: otherAvatar ? otherAvatar : interaction.user.avatarURL({ dynamic: true, size: 512 }) 
		});
	}

}
