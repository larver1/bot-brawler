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
        description: "Accept a friend request from your inbox.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list.",
            required: true,
            type: "INTEGER"
        }
    ]},
    {
        name: "reject",
        description: "Reject a user's friend request from your inbox.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "number",
            description: "The request number in your /requests list",
            required: true,
            type: "INTEGER"
        }
    ]}
    ],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let subCommand = interaction.options.getSubcommand();

        //Display list of friends
        if(subCommand == "list") {
            // Gets friends list
            let friends = await utils.db.getData(interaction, "friends");

            if(friends.length <= 0)  {
                await utils.user.pause(false);
                return utils.handler.info(interaction, new Error("Your friends list is empty... 😔"));
            }

            let friendsList = ``;

            // Display in a presentable form
            for(let friendInfo of friends) {
                let friend = await utils.db.findUsername(interaction, friendInfo);
                if(!friend) {
                    await utils.user.pause(false); 
                    return;
                }

                let timeSinceActive = await utils.db.getData(interaction, "lastCommand", friend.user_id);
                friendsList += `-> **${friendInfo}**\n\tLast active: \`${timeSinceActive}\`\n`; 
            }

            // Use helper to put into multiple pages
            await utils.messageHelper.listPages(interaction, utils.user, friendsList, {
                title: `Friends List`,
                linesPerPage: 10
            });

            await utils.user.pause(false); 
            return;

        } 

        if(subCommand == "accept" || subCommand == "reject") {

            //Check if both users exist and can add each other
            const msg = await utils.messenger.getMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "friend");
            if(!msg) {
                await utils.user.pause(false); 
                return;
            }

            const otherUser = await utils.db.findUsername(interaction, msg.sender_username);
            if(!otherUser) {
                await utils.user.pause(false); 
                return;
            }

            if(subCommand == "accept") {

                await utils.dbAchievements.editAchievement(interaction, msg.recipient_username, "Social Butterfly", otherUser.username);
                await utils.dbAchievements.editAchievement(interaction, msg.sender_username, "Social Butterfly", utils.user.username);

                if(!await utils.db.add(interaction, "friend", msg.sender_username, utils.user.user_id)) {
                    await utils.user.pause(false); 
                    return;
                }
                if(!await utils.db.add(interaction, "friend", msg.recipient_username, otherUser.user_id)) {
                    await utils.user.pause(false); 
                    return;
                }

                await utils.dbAchievements.checkTask(interaction, utils.user.username, "Pals");
                await utils.dbAchievements.checkTask(interaction, otherUser.username, "Pals");

            }

            if(!await utils.messenger.deleteMessageByNumber(interaction, utils.user, interaction.options.getInteger("number"), "friend")) {
                await utils.user.pause(false); 
                return;
            }

            //Clear all other friend requests which will be made redundant
            await utils.messenger.clearMessages(interaction, utils.user, otherUser, "friend");
            await utils.messenger.clearMessages(interaction, otherUser, utils.user, "friend");

            //Notify the recipient if they have been accepted
            if(subCommand == "accept") 
                await utils.messenger.sendDM(interaction, utils.client, otherUser, 
                    `${utils.user.username} has accepted your friend request!`);
            
            //Display results
            await utils.user.pause(false); 
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${otherUser.username}'s Friend Request`)
                    .setDescription(`You have ${subCommand}ed \`${otherUser.username}\`'s friend request.`)] })
                        .catch((e) => utils.consola.error(e));

        } else if(subCommand == "add") {

            const otherUser = await utils.db.findUsername(interaction, await interaction.options.getString("username"));
            if(!otherUser) {
                await utils.user.pause(false); 
                return;
            }

            if(await utils.db.findFriend(interaction, otherUser.username) == true)  {
                await utils.user.pause(false); 
                return utils.handler.info(interaction, new Error("This friend has already been added."));
            }

            //Checks if recipient has already been sent a message by this user
            if(await utils.messenger.checkMessages(interaction, utils.user, otherUser)) {
                await utils.user.pause(false); 
                return utils.handler.info(interaction, new Error("You can only send this person one request at a time."));
            }

            if(await utils.messenger.checkMessages(interaction, otherUser, utils.user, "friend"))  {
                await utils.user.pause(false); 
                return utils.handler.info(interaction, new Error("This user has already sent you a friend request, so you can't send your own."));
            }

            //Send message to other user
            let messageNumber = await utils.messenger.sendFriendRequest(interaction, utils.user, otherUser);
            if(!messageNumber) {
                await utils.user.pause(false); 
                return;
            }

            await utils.dbAchievements.checkTask(interaction, utils.user.username, "Networking");

            //Inform recipient of friend request
            await utils.messenger.sendDM(interaction, utils.client, otherUser, 
                `${utils.user.username} has sent you a friend request.\nTo accept: \`/friend accept ${messageNumber}\`\nTo reject: \`/friend reject ${messageNumber}\``);

        } else if(subCommand == "remove") {

            const otherUser = await utils.db.findUsername(interaction, await interaction.options.getString("username"));
            if(!otherUser) {
                await utils.user.pause(false); 
                return;
            }

            if(await utils.db.findFriend(interaction, otherUser.username) == false)  {
                await utils.user.pause(false); 
                return utils.handler.info(interaction, new Error(`The username \`${otherUser.username}\` is not in your friends list.`));
            }

            //Try removing friend from both lists, if failed - return
            if(!await utils.db.remove(interaction, "friend", otherUser.username)) {
                await utils.user.pause(false); 
                return;
            }
            if(!await utils.db.remove(interaction, "friend", utils.user.username, otherUser.user_id)) {
                await utils.user.pause(false); 
                return;
            }

            await utils.user.pause(false); 
            return interaction.editReply({ embeds: [
                new utils.embed(interaction, utils.user)
                    .setTitle(`${utils.user.username}'s Sworn Enemy`)
                    .setDescription(`\`${otherUser.username}\` has been removed as a friend.`)] })
                        .catch((e) => utils.consola.error(e));

        }

    }
}