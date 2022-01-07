const { Client, MessageEmbed } = require("discord.js");
const { Users } = require('../../Database/dbObjects');

module.exports = {
    name: "register",
    description: "Cnoose a username to start your adventure.",
    options: [{
        name: "username",
        description: "Enter a username, this cannot be changed!",
        required: true,
        type: "STRING"
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, exec) {

        let username = interaction.options.getString("username");
        let user = await Users.findOne({ where: { user_id: interaction.user.id }});

        if(user)
            return interaction.reply({ content: `You already have an account with username: \`${user.username}\`!`});

		user = await Users.create({ user_id: interaction.user.id, username: username });
        return interaction.reply({ content: `You have successfully registered with the name \`${username}\``});

    }
}