const schedule = require('node-schedule');
const { Users } = require('../Database/dbObjects');
const Messenger = require('../Helpers/Messenger');
const db = require('../Database/dbAccess');
const consola = require("consola");

const wagers = ["destroy", "collect", "damage"];

module.exports = async(client) => {
    schedule.scheduleJob('0 */1 * * * *', async() => {
        consola.info("BotUser requests being fired.")
        await Users.findAll().then(async function(DBUsers){
            for (let i = 0; i < DBUsers.length; i++) {
                const user = DBUsers[i];
    
                // Non-public users can't receive requests from random users
                if(user.isBot || user.privacy != "public")
                    continue;
    
                // Check if user has any battle requests to do
                let inbox = await Messenger.readAllMessages(null, user, "battle", true, true, false);
                if(inbox.length > 0)
                    continue;
                
                // Find bot user to send challenge
                let botToPick = Math.floor(Math.random() * 99);
                const botUser = await db.findUsername(null, `olibot-${botToPick}`);
    
                // Get bot collections and pick a random bot
                const userCollection = await user.getBots();
                const botCollection = await botUser.getBots();
    
                let userChosenBot = userCollection[Math.floor(Math.random() * userCollection.length)];
                let otherChosenBot = botCollection[Math.floor(Math.random() * botCollection.length)];
    
                if(!userChosenBot || !otherChosenBot)
                    continue;
                
                // Pick opponents until it is a fair fight
                let attempts = 0;
                while(((!userChosenBot.alive || !otherChosenBot.alive) || otherChosenBot.exp > userChosenBot.exp) && attempts < 100) {
                    otherChosenBot = botCollection[Math.floor(Math.random() * botCollection.length)];
                    attempts++;
                }
    
                if(attempts >= 100)
                    continue;
                
                // Send off the battle request            
                const details = {
                    sender_bot_id: otherChosenBot.bot_id,
                    recipient_bot_id: userChosenBot.bot_id,
                    wager: wagers[Math.floor(Math.random() * wagers.length)]
                };
    
                let messageNumber = await Messenger.sendBattleRequest(null, botUser, user, details);
                if(!messageNumber)
                    continue;
    
                await Messenger.sendDM(null, client, user, 
                    `${botUser.username} has sent you a battle request.\nFor more info: \`/requests info ${messageNumber}\`.`);
                
                consola.info(`Sent BotUser request: ${user.username}'s ${userChosenBot.bot_type} vs. ${botUser.username}'s ${otherChosenBot.bot_type}`);
    
            }
    
        });
    
    });
    
}
