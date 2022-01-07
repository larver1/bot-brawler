const { MessageEmbed } = require('discord.js');

module.exports = class sampleEmbed extends MessageEmbed
{
	constructor(interaction)
	{
		super();
		this.setTimestamp()
		this.setColor(`DARK_GOLD`)
		this.setFooter({ text: 'Bot Brawler' })
		this.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true, size: 512 }) })

	}

}
