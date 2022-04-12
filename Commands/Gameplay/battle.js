const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const BotBuilder = require("../../Helpers/BotBuilder");
const BotObj = require("../../Data/Bots/BotObj");
const BattleView = require("../../Helpers/BattleView");
const BotCollection = require("../../Helpers/BotCollection");
const { promisify } = require('util');
const sleep = promisify(setTimeout);

module.exports = {
    name: "battle",
    description: "Battle your bot with another player.",
    options: [{
        name: "user",
        description: "Battle with another user on the server.",
        required: false,
        type: "SUB_COMMAND",
        options: [{
            name: "user",
            description: "Mention the person's @tag.",
            required: true,
            type: "USER"
        },
        {
            name: "wager",
            description: "Choose the wager involved.",
            required: true,
            type: "STRING",
            choices: [{
                name: "Destroy",
                value: "destroy"
            },
            {
                name: "Collect",
                value: "collect"
            },
            {
                name: "Damage",
                value: "damage"
            },
            {
                name: "Friendly",
                value: "friendly"
            }
            ]
        },
        ]
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let bots = await utils.user.getBots();
        let collection = await new BotCollection(bots, interaction);
        const otherUser = await utils.db.findUser(interaction, interaction.options.getUser("user").id);

        if(!collection || !otherUser)
            return;

        let otherBots = await otherUser.getBots();
        let otherCollection = await new BotCollection(otherBots, interaction);

        //Inspect the collection
        await collection.inspectCollection(interaction, 1);

        //When a card is selected, display it
        collection.selectedEvent.on(`selected`, async () => {

            let yourBot = collection.selected;

            const yourCard = await new utils.card(interaction, yourBot);

            if(!await yourCard.createCard())
                return;

            await interaction.editReply({ files: [yourCard.getCard()] })
                .catch(e => utils.consola.error(e));

            await otherCollection.inspectCollection(interaction, 1);

            otherCollection.selectedEvent.on(`selected`, async() => {

                let otherBot = otherCollection.selected;
                const otherCard = await new utils.card(interaction, otherBot);

                let results = await yourBot.battle(otherBot);
                let msg = `${yourBot.name} ${yourBot.getBattleText()}\n${otherBot.name} ${otherBot.getBattleText()}\n\nBattle commence...`;
                let wager = interaction.options.getString("wager");
                let loserBot, winnerBot, loserUser, winnerUser, exp;

                //New battle scene
                let scene = await new BattleView(interaction, yourBot, otherBot, results);
                await scene.createCards();

                await interaction.editReply({ content: msg, files: [scene.getScene()] });
                await sleep(10000);

                msg = `${results.winner <= results.yourPercent ? yourBot.name + " is the winner" : otherBot.name + " is the winner"}`;

                //Determine winner
                if(results.winner <= results.yourPercent){
                    winnerBot = yourBot;
                    winnerUser = utils.user;
                    loserBot = otherBot;
                    loserUser = otherUser;
                } else {
                    winnerBot = otherBot;
                    winnerUser = otherUser;
                    loserBot = yourBot;
                    loserUser = utils.user;
                }

                //Update global stats
                if(!await utils.dbBotStats.addWin(interaction, winnerBot.bot_type))
                    return;
                if(!await utils.dbBotStats.addLoss(interaction, loserBot.bot_type))
                    return;

                winnerBot.battling = true;
                const winnerCard = await new utils.card(interaction, winnerBot);

                if(!await winnerCard.createCard())
                    return;

                switch(wager) {
                    case "destroy":
                        //Loser bot is destroyed and is no longer usable
                        msg += `\nLoser bot gets destroyed by winner for EXP.`;
                        exp = Math.ceil(loserBot.exp);
                        if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                            return;
                        if(!await utils.dbBots.destroy(interaction, loserBot.botObj.bot_id))
                            return;
                        if(!await utils.dbBotStats.removeAlive(interaction, loserBot.bot_type))
                            return;
                        break;
                    case "collect":
                        //The loser bot owner changes to winner username
                        msg += `\nLoser bot gets collected by winner.`;
                        if(!await utils.dbBots.changeOwner(interaction, loserBot.botObj.bot_id, winnerUser.username))
                            return;
                        break;
                    case "damage":
                        //Pass EXP over to winner
                        msg += "\nLoser bot gives winner bot some EXP.";
                        exp = Math.ceil(loserBot.exp / 5);

                        if(exp == 0) 
                            msg += "\nLoser had no EXP left to give, so was destroyed for scrap metal...";

                        if(!await utils.dbBots.removeExp(interaction, loserBot.botObj.bot_id, exp)) 
                            return;
                        if(!await utils.dbBots.addExp(interaction, winnerBot.botObj.bot_id, exp + 1))
                            return;
                        break;
                    case "friendly":
                        msg += "\nThe bots shake claws and go their separate ways.";
                        break;
                    default:
                        break;
                }

                // If bot has unique winning image, show it
                if(winnerBot.obj.imageWin) {
                    winnerCard.botObj.image = winnerBot.obj.imageWin;
                    await winnerCard.createCard();
                }

                await interaction.editReply({ files: [winnerCard.getCard()], content: msg });

            });

        });

    }

}