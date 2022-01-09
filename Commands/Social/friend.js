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
        name: "accept",
        description: "Accept a friend request.",
        type: "SUB_COMMAND",
        options: [{
            name: "username",
            description: "Enter the person's Bot Brawler username.",
            required: true,
            type: "STRING"
        }],
    },
    {
        name: "reject",
        description: "Reject a friend request.",
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
        let requests = await utils.user.getIncomingMessages();
        requests = requests.filter((req) => req.message_type == "friend");

        if(!utils.user)
            return;

        //Display list of friends
        if(subCommand == "list") {
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Friend List`)
                    .setDescription(`${utils.user.friends}`)] })
                        .catch((e) => utils.consola.error(e));
        } else if(subCommand == "requests") {
            let message = ``;

            //Searches for all requests
            for(const req of requests) 
                message += `-> ${req.message_content}\n\n`;

            message += "\n`/friend accept username`\n`/friend reject username`";

            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Friend Requests`)
                    .setDescription(`${message}`)] })
                        .catch((e) => utils.consola.error(e));
        }

        //Check if both users exist and can add each other
        let username = interaction.options.getString("username"); 
        const otherUser = await utils.db.findUsername(interaction, username);

        if(!otherUser)
            return;

        if(subCommand == "accept" || subCommand == "reject") {

            let found = false;

            for(const req of requests) {

                //If friend request is found, delete message and add each other if necessary
                if(req.sender_username.toLowerCase() == username.toLowerCase()) {
                    if(subCommand == "accept") {
                        if(!await utils.db.add(interaction, "friend", req.sender_username, utils.user.user_id))
                            return;
                        if(!await utils.db.add(interaction, "friend", req.recipient_username, otherUser.user_id))
                            return;
                    }

                    //Remove message and finish searching
                    await utils.user.removeMessage(req);
                    found = true;
                    break;
                }

            }

            let outgoingRequests = await otherUser.getIncomingMessages();
            outgoingRequests = outgoingRequests.filter((req) => req.message_type == "friend");    

            //If other user ALSO sent a request, delete it
            for(const req of outgoingRequests) {
                if(req.recipient_username == utils.user.username)
                    await otherUser.removeMessage(req);
            }

            if(!found) 
                return utils.handler.handle(interaction, new Error(`A request from \`${otherUser.username}\` does not exist.`));
            
            //Display results
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${otherUser.username}'s Friend Request`)
                    .setDescription(`You have ${subCommand}ed \`${otherUser.username}\`'s friend request.`)] })
                        .catch((e) => utils.consola.error(e));

        } else if(subCommand == "add") {
            if(await utils.db.findFriend(interaction, otherUser.username) == true)
                return utils.handler.handle(interaction, new Error("This friend has already been added."));

            //Checks recipient's messages
            let otherMessages = await otherUser.getIncomingMessages();
            let valid = true;
            for(const request of otherMessages) {
                if(request.sender_username == utils.user.username) {
                    valid = false;
                }
            }

            if(!valid)
                return utils.handler.handle(interaction, new Error("You can only send this person one request at a time."));

            //Send message to other user
            utils.user.createMessage({
                recipient_username: otherUser.username,
                message_type: "friend",
                message_content: `Friend Request to ${otherUser.username} from ${utils.user.username}.`
            });

            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Friend Request`)
                    .setDescription(`A friend request has been sent to \`${otherUser.username}\`.`)] })
                        .catch((e) => utils.consola.error(e));
        } else if(subCommand == "remove") {
            if(await utils.db.findFriend(interaction, otherUser.username) == false)
                return utils.handler.handle(interaction, new Error(`The username ${otherUser.username} is not in your friends list.`));

            //If error occurred, return
            if(!await utils.db.remove(interaction, "friend", otherUser.username))
                return;

            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Sworn Enemy`)
                    .setDescription(`\`${otherUser.username}\` has been removed as a friend.`)] })
                        .catch((e) => utils.consola.error(e));

        }

    }
}