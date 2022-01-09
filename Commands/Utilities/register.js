const { Client, MessageEmbed } = require("discord.js");
const { findUsername } = require("../../Database/dbAccess");
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

        //Prevents user from making more than one account
        if(user)
            return interaction.editReply({ embeds: [ 
                new utils.embed(interaction, user)
                    .setDescription(`You already have an account with username: \`${user.username}\`!`)] })
                        .catch((e) => utils.consola.error(e));

        //Attempts to register user to DB
		user = await Users.create({ user_id: interaction.user.id, username: username, friends: "|", privacy: "public" })
        .catch((e) => {
            let err = new Error(`A user with the name \`${username}\` already exists! Please try again.`);
            return utils.handler.info(interaction, err);    
        });

        if(!user)
            return;

        //Tries to send DM, if failed, then cancel
        if(!await utils.messenger.sendDM(interaction, utils.client, user, `Welcome to Bot Brawler. This game relies on Direct Messages to notify you about requests from other players (such as battling, trading). Please keep your Server DMs on for your server with Bot Brawler in order to play the game. Thanks, and enjoy!`)) {
            let err = new Error(`Bot Brawler requires Server DMs to be turned on in order to play. Please toggle the 'Server DMs' option in this server's Privacy Settings, and try again.`);
            await user.destroy();
            await utils.handler.info(interaction, err);
            return;
        }
        
        //Successful signup message
        return interaction.editReply({ embeds: [
            new utils.embed(interaction, user)
                .setDescription(`You have successfully registered with the name \`${username}\``)] })
                    .catch((e) => utils.consola.error(e));

    }
}