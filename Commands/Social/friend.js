const { Client, MessageEmbed } = require("discord.js");
const { Users } = require('../../Database/dbObjects');

module.exports = {
    name: "friend",
    description: "Manage a list of friends who play Bot Brawler.",
    options: [{
        name: "list",
        description: "Show your friends list.",
        type: "SUB_COMMAND"
    },
    {
        name: "add",
        description: "Add a friend.",
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "Enter the person's Bot Brawler username.",
            required: true,
            type: "STRING"
        }],
    },
    {
        name: "remove",
        description: "Remove a friend.",
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "Enter the person's Bot Brawler username.",
            required: true,
            type: "STRING"
        }],
    },
    {
        name: "requests",
        description: "View all incoming + outgoing friend requests.",
        type: "SUB_COMMAND",
    }
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let subCommand = interaction.options.getSubcommand();
        const user = await utils.db.findUser(interaction);

        if(!user)
            return;

        //Display list of friends
        if(subCommand == "list") {
            return interaction.editReply({ embeds: [
                new utils.embed(interaction)
                    .setTitle(`${user.username}'s Friend List`)
                    .setDescription(`${user.friends}`)] })
                        .catch((e) => utils.consola.error(e));
        } else if(subCommand == "requests") {
            let requests = await user.getIncomingMessages();
            let message = ``;

            //Searches for all requests
            for(const req of requests) {
                const senderUser = await utils.db.findUser(interaction, req.sender_id);
                if(!senderUser)
                    return;
                message += `-> Friend Request from: \`${senderUser.username}\`\n\n`;
            }

            message += "\n`/friend request accept username`\n`/friend request reject username`";

            return interaction.editReply({ embeds: [
                new utils.embed(interaction)
                    .setTitle(`${user.username}'s Friend Requests`)
                    .setDescription(`${message}`)] })
                        .catch((e) => utils.consola.error(e));
        }

        //Check if both users exist and can add each other
        let username = interaction.options.getString("username"); 
        const otherUser = await utils.db.findUsername(interaction, username);

        if(!otherUser)
            return;

        if(subCommand == "add") {
            if(await utils.db.findFriend(interaction, otherUser.username) == true)
                return utils.handler.handle(interaction, new Error("This friend has already been added."));

            //Checks recipient's messages
            let otherMessages = await otherUser.getIncomingMessages();
            let valid = true;
            for(const request of otherMessages) {
                if(request.sender_id == user.user_id) {
                    valid = false;
                }
            }

            if(!valid)
                return utils.handler.handle(interaction, new Error("You can only send this person one request at a time."));

            //Send message to other user
            user.createMessage({
                recipient_id: otherUser.user_id,
                message_type: "friend",
                message_content: `Friend Request to ${otherUser.username} from ${user.username}.`
            });

            return interaction.editReply({ embeds: [
                new utils.embed(interaction)
                    .setTitle(`${user.username}'s Friend Request`)
                    .setDescription(`A friend request has been sent to \`${otherUser.username}\`.`)] })
                        .catch((e) => utils.consola.error(e));
        }

        if(subCommand == "remove") {
            if(await utils.db.findFriend(interaction, otherUser.username) == false)
                return utils.handler.handle(interaction, new Error(`The username ${otherUser.username} is not in your friends list.`));

            //If error occurred, return
            if(!await utils.db.remove(interaction, "friend", otherUser.username))
                return;

            return interaction.editReply({ embeds: [
                new utils.embed(interaction)
                    .setTitle(`${user.username}'s Sworn Enemy`)
                    .setDescription(`\`${otherUser.username}\` has been removed as a friend.`)] })
                        .catch((e) => utils.consola.error(e));

        }

    }
}