const { Client, MessageEmbed } = require("discord.js");
const { Users } = require('../../Database/dbObjects');

module.exports = {
    name: "message",
    description: "Send a message to a friend!",
    options: [ {
        name: "send",
        description: "Send a message to a friend.",
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "Enter the person's Bot Brawler username.",
            required: true,
            type: "STRING"
        },
        {
            name: "message",
            description: "The message to send to the user.",
            required: true,
            type: "STRING"
        }],
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {
        let username = interaction.options.getString("username"); 
        let message = interaction.options.getString("message"); 

        const otherUser = await utils.db.findUsername(interaction, username);

        if(!otherUser)
            return;

        //Check if they are friends
        if(!await utils.db.findFriend(interaction, otherUser.username))
            return utils.handler.info(interaction, new Error(`You must be friends with ${otherUser.username} to send a message.`));

        //Fetch the client user
        let userToSend = await utils.client.users.fetch(otherUser.user_id);
        if(!userToSend)
            return utils.handler.info(interaction, new Error(`Failed to send a message to user \`${otherUser.username}\`. This could happen if they don't share any servers with Bot Brawler.`));

        let success = true;

        //Send user the message
        await userToSend.send(`${utils.user.username} said: ${message}`)
            .catch(() => {
                success = false;
                return utils.handler.info(interaction, new Error(`Failed to send a message to user \`${otherUser.username}\`. They may have their Discord DMs disabled.`)); 
            });

        if(!success)
            return;

        //Display results
        return interaction.editReply({ embeds: [
            new utils.embed(interaction, utils.user)
                .setTitle(`${utils.user.username}'s Message`)
                .setDescription(`You have sent a message to \`${otherUser.username}\`.`)] })
                    .catch((e) => utils.consola.error(e));
            
    }
}