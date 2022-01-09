const consola = require("consola");
const sampleEmbed = require("./sampleEmbed.js");
const ErrorHandler = require("./ErrorHandler.js");

module.exports = class Messenger
{
    //Send message to other user
    static async sendFriendRequest(interaction, sender, recipient) {
        if(!sender || !recipient) {
            let err = new Error(`Passed invalid sender or recipient to sendFriendRequest().`);
            await ErrorHandler.handle(interaction, err);
            return;
        }

        await sender.createMessage({
            recipient_username: recipient.username,
            message_type: "friend",
            message_content: `Friend Request to ${recipient.username} from ${sender.username}.`
        });

        return interaction.editReply({ embeds: [
            new sampleEmbed(interaction, sender)
                .setTitle(`${sender.username}'s Friend Request`)
                .setDescription(`A friend request has been sent to \`${recipient.username}\`.`)] })
                    .catch((e) => consola.error(e));
    }

    //Check for messages from sender to recipient
    static async checkMessages(interaction, sender, recipient, messageType) {
        let messages = await sender.getIncomingMessages();
        let found = false;

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return false;

        for(const msg of messages) {
            if(msg && msg.recipient_username == recipient.username)
                found = true;
        }

        return found;
    }

    //Clear all messages from sender to recipient
    static async clearMessages(interaction, sender, recipient, messageType) {
        let messages = await sender.getIncomingMessages();

        if(messageType) 
            messages = messages.filter((msg) => msg.message_type == messageType);

        if(!messages)
            return;

        for(const msg of messages) {
            if(msg && msg.recipient_username == recipient.username)
                await recipient.removeMessage(msg);
        }

    }

    static async sendDM(interaction, client, recipient, message) {
        //Fetch the client user
        let userToSend = await client.users.fetch(recipient.user_id);

        //Send user the message
        await userToSend.send(`${message}`)
            .catch(() => {
                //Not an urgent error, so just log it
                return consola.error(new Error(`Failed to send a message to user \`${otherUser.username}\`. They may have their Discord DMs disabled.`)); 
            });
    }


}
