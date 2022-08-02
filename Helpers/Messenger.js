const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");
const ErrorHandler = require("./ErrorHandler.js");
const { Bots } = require("../Database/dbObjects");
const BotObj = require("../Data/Bots/BotObj");

module.exports = class Messenger
{

    //Find a message number for new message
    static async generateMessageNumber(interaction, recipient) {
        const messages = await recipient.getIncomingMessages();

        // Search for a message number and find next available one
        for(var number = 1; number <= messages.length; number++) {
            let found = false;
            for(const msg of messages) {
                if((msg.message_number) == number) {
                    found = true;
                    break;
                }
            }

            // Empty space, so break out of loop and use given number
            if(!found) {
                break;
            }
        }

        return number;

    }

    static async findBotObj(interaction, botID) {
		const bot = await Bots.findOne({ where: { bot_id: botID } });
		if(!bot) {
			let err = new Error(`Bot of ID ${botID} could not be found.`);
			return ErrorHandler.handle(interaction, err);
		}

        let botObj = await new BotObj(interaction, bot);
		return botObj;
    }

    //Send message to other user
    static async sendFriendRequest(interaction, sender, recipient) {
        if(!sender || !recipient) {
            let err = new Error(`Passed invalid sender or recipient to sendFriendRequest().`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        if(recipient.privacy == "locked") {
            let err = new Error(`\`${recipient.username}\` is not accepting friend requests at the moment...`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        // If privacy is locked, alert the user
        if(sender.privacy == "locked") {
            let err = new Error(`You cannot send any requests, as your \`/privacy\` level is set to Locked.`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        let messageNumber = await this.generateMessageNumber(interaction, recipient);

        await sender.createMessage({
            recipient_username: recipient.username,
            message_type: "friend",
            message_content: `Friend Request to ${recipient.username} from ${sender.username}.`,
            message_number: messageNumber,
        });

        await interaction.editReply({ embeds: [
            new sampleEmbed(interaction, sender)
                .setTitle(`${sender.username}'s Friend Request`)
                .setDescription(`A friend request has been sent to \`${recipient.username}\`.`)] })
                    .catch((e) => consola.error(e));
    
        return messageNumber;

    }

    static async getBattleRequest(interaction, message) {
        if(!message) {
            let err = new Error(`Passed invalid message to acceptBattleRequest().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }

        let details = message.message_content.split("|");
        let yourBot = await this.findBotObj(interaction, details[1]);
        let otherBot = await this.findBotObj(interaction, details[0]);
        let wager = details[2];

        if(!yourBot || !otherBot)
            return false;

        return {
            yourBot: yourBot,
            otherBot: otherBot,
            wager: wager
        }

    }

    static async getTradeRequest(interaction, message) {
        if(!message) {
            let err = new Error(`Passed invalid message to acceptBattleRequest().`);
            await ErrorHandler.handle(interaction, err);
            return false;
        }

        let details = message.message_content.split("|");
        let yourBot = await this.findBotObj(interaction, details[1]);
        let otherBot = await this.findBotObj(interaction, details[0]);
        let wager = details[2];

        if(!yourBot || !otherBot)
            return false;

        return {
            yourBot: yourBot,
            otherBot: otherBot,
            wager: wager
        }

    }

    //Send battle request to other user
    static async sendBattleRequest(interaction, sender, recipient, details) {
        if(!sender || !recipient) {
            let err = new Error(`Passed invalid sender or recipient to sendBattleRequest().`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        // If privacy is friends only and not a friend, alert the user
        if(recipient.privacy != "public" && !recipient.friends.includes(sender.username)) {
            let err = new Error(`\`${recipient.username}\` needs to be on your friends list before you can send them a battle request...`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        // If privacy is locked, alert the user
        if(recipient.privacy == "locked") {
            let err = new Error(`\`${recipient.username}\`'s account is inactive and is not accepting any requests...`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        // If privacy is locked, alert the user
        if(sender.privacy == "locked") {
            let err = new Error(`You cannot send any requests, as your \`/privacy\` level is set to Locked.`);
            await ErrorHandler.info(interaction, err);
            return;
        }

        let messageNumber = await this.generateMessageNumber(interaction, recipient);

        await sender.createMessage({
            recipient_username: recipient.username,
            message_type: "battle",
            message_content: `${details.sender_bot_id}|${details.recipient_bot_id}|${details.wager}`,
            message_number: messageNumber,
        });

        if(!sender.isBot) {
            await interaction.editReply({ components: [], embeds: [
                new sampleEmbed(interaction, sender)
                    .setTitle(`${sender.username}'s Battle Request`)
                    .setDescription(`A battle request has been sent to \`${recipient.username}\`. You will be DM'd the outcome of the battle if they choose to accept.`)] })
                        .catch((e) => consola.error(e));
        }
  
        return messageNumber;

        }

        //Send trade request to other user
        static async sendTradeRequest(interaction, sender, recipient, details) {
            if(!sender || !recipient) {
                let err = new Error(`Passed invalid sender or recipient to sendTradeRequest().`);
                await ErrorHandler.handle(interaction, err);
                return;
            }
    
            // If privacy is friends only and not a friend, alert the user
            if(recipient.privacy != "public" && !recipient.friends.includes(sender.username)) {
                let err = new Error(`\`${recipient.username}\` needs to be on your friends list before you can send them a trade request...`);
                await ErrorHandler.info(interaction, err);
                return;
            }
    
            // If privacy is locked, alert the user
            if(recipient.privacy == "locked") {
                let err = new Error(`\`${recipient.username}\`'s account is inactive and is not accepting any requests...`);
                await ErrorHandler.info(interaction, err);
                return;
            }
    
            // If privacy is locked, alert the user
            if(sender.privacy == "locked") {
                let err = new Error(`You cannot send any requests, as your \`/privacy\` level is set to Locked.`);
                await ErrorHandler.info(interaction, err);
                return;
            }
    
            await sender.createMessage({
                recipient_username: recipient.username,
                message_type: "trade",
                message_content: `${details.selling_user.username}|${details.buying_user.username}|${details.bot_id}|${details.amount_offered}`,
                message_number: await this.generateMessageNumber(interaction, recipient),
            });
    
            return interaction.editReply({ embeds: [
                new sampleEmbed(interaction, sender)
                    .setTitle(`${sender.username}'s Trade Request`)
                    .setDescription(`A trade request has been sent to \`${recipient.username}\`. You will be DM'd if they accept the deal.`)] })
                        .catch((e) => consola.error(e));
        }

    //Check for messages from sender to recipient
    static async checkMessages(interaction, sender, recipient, messageType) {
        let messages = await sender.getOutgoingMessages();
        let found = false;

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return false;

        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(msg && msg.recipient_username == recipient.username) {
                found = true;
                break;
            }
        }

        return found;
    }

    //Check for messages from sender to recipient
    static async getMessageFrom(interaction, sender, recipient, messageType) {
        let messages = await sender.getOutgoingMessages();

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return false;

        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(msg && msg.recipient_username == recipient.username) {
                return msg;
            }
        }

        let err = new Error(`You have no requests from this user...`);
        await ErrorHandler.info(interaction, err);
        return;
    }

    //Delete message with given number
    static async deleteMessageByNumber(interaction, recipient, messageNumber, messageType) {
        const msg = await this.getMessageByNumber(interaction, recipient, messageNumber, messageType);
        
        if(!msg) {
            let err = new Error(`You have no requests with this number...`);
            await ErrorHandler.info(interaction, err);
            return;
        }
        
        await recipient.removeMessage(msg);
        return true;
    }

    //Check for messages from sender to recipient
    static async getMessageByNumber(interaction, recipient, messageNumber, messageType) {
        let messages = await recipient.getIncomingMessages();

        if(!messages)
            return false;

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(msg && msg.message_number == messageNumber) {
                return msg;
            }
        }

        let err = new Error(`You have no requests with this number...`);
        await ErrorHandler.info(interaction, err);
        return;
    }

    compareAscending(a, b) {
        if (a.message_number < b.message_number)
            return -1;
        if (a.message_number > b.message_number)
            return 1;
        return 0;
    }

    //Check all messages to recipient
    static async readAllMessages(interaction, recipient, messageType, sortByNum, hideErrors, outgoing) {
        let messages = await recipient.getIncomingMessages();
        let outgoingMessages = await recipient.getOutgoingMessages();
        let inbox = [];

        // Filter by certain message
        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return false;

        if(outgoing)
            messages = [...messages, ...outgoingMessages];

        // Sort with ascending ID number
        if(sortByNum)
            messages = messages.sort(this.compareDescending);

        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(msg && msg.recipient_username == recipient.username) {
                inbox.push(msg);
            }
        }

        // If inbox is empty
        if(!inbox.length && !hideErrors) {
            let err = new Error(`You have no requests of this type...`);
            await ErrorHandler.info(interaction, err);
            return false;
        }     

        return inbox;
    }

    //Clear all messages from sender to recipient
    static async clearMessages(interaction, sender, recipient, messageType) {
        let messages = await sender.getOutgoingMessages();

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return;

        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(msg && msg.recipient_username == recipient.username) {
                await sender.removeMessage(msg);
            }
        }

    }

    static async sendDM(interaction, client, recipient, message, image) {
        // Fetch the client user
        let userToSend = await client.users.fetch(recipient.user_id);
        let success = true;

        if(recipient.privacy == "locked") {
            consola.warn(new Error(`\`${recipient.username}\` is not accepting DMs from the bot.`));
            return false;
        }

        // Bot users can't receive DMs
        if(recipient.isBot == true)
            return true;

        let otherAvatar = userToSend.avatarURL({ dynamic: true, size: 512 });

        const dm = new sampleEmbed(interaction, recipient, otherAvatar, userToSend)
            .setTitle(`You have received a message!`)
            .setDescription(`${message}\n\nIf you would like to opt out of Bot DMs, use \`/privacy set level:Locked\``)
        
        if(image)
            dm.setImage(image);

        // Send user the message
        await userToSend.send({ embeds: [dm] })
            .catch((err) => {
                // Not an urgent error, so just log it
                consola.warn(new Error(`Failed to send a message to user \`${recipient.username}\`.\n ${err}`)); 
                success = false;
            });

        return success;
   
    }

}
