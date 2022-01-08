const { Client, MessageEmbed } = require("discord.js");
const { Users } = require('../../Database/dbObjects');

module.exports = {
    name: "register",
    description: "Choose a username to start your adventure.",
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
    async execute(interaction, utils) {

        let username = interaction.options.getString("username");
        let user = await Users.findOne({ where: { user_id: interaction.user.id }});

        if(user)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction)
                    .setDescription(`You already have an account with username: \`${user.username}\`!`)] })
                        .catch((e) => utils.consola.error(e));

		user = await Users.create({ user_id: interaction.user.id, username: username, friends: "|" });
        
        return interaction.editReply({ embeds: [
            new utils.embed(interaction)
                .setDescription(`You have successfully registered with the name \`${username}\``)] })
                    .catch((e) => utils.consola.error(e));

    }
}