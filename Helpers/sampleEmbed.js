const { MessageEmbed } = require('discord.js');

module.exports = class sampleEmbed extends MessageEmbed
{
	constructor(interaction, user)
	{	
		super();
		this.setTimestamp()
		this.setColor(`DARK_GOLD`)
		this.setFooter({ text: 'Bot Brawler' })
		this.setAuthor({ name: user ? user.username : interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true, size: 512 }) })

	}

}
