const { MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const glob = require("glob");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const GamesMap = new Map();
const fs = require('fs');
const gameLevels = JSON.parse(fs.readFileSync('./Data/Minigames/Assets/gameLevels.json'));
const EventEmitter = require('events');
const machinePartEmoji = "<:machine_parts:992728693799669801>";

// Add every game to map so it can be executed
glob.sync('./Data/Minigames/*.js').forEach(function(file) {
    const game = require(path.resolve(file));
    GamesMap.set(game.name, game);
});

module.exports = {
    name: "minigame",
    description: "Play various minigames and earn Machine Parts for winning.",
    usage: "`/minigame name` allows you to choose the minigame you wish to play.",
    options: [{
        name: "name",
        description: "The name of the game you wish to play.",
        required: true,
        type: "STRING",
        choices: [
            {
                name: "Ramselle's Dating Simulator",
                value: "date",
            }, 
            {
                name: "Bostrom's Claw Machine",
                value: "claw",
            },
            {
                name: "Constant's Doll House",
                value: "doll",
            },
            {
                name: "Ransom Blue's Tic Tac Toe",
                value: "xo"
            },
            {
                name: "Trojo's Slot Machine",
                value: "slots"
            }
        ]
    }],
    /**
     * @param {CommandInteraction} CommandInteraction
     * @param {Object} executeObj
     */
    async execute(interaction, utils) {

        let gameName = await interaction.options.getString("name");
        let gameToPlay = await GamesMap.get(gameName); 

        if(!gameToPlay) {
            let err = new Error(`The game with name ${gameName} does not exist!`);
            await utils.handler.handle(interaction, err);  
            await utils.user.pause(false); 
            return;
        }

        let levels = gameLevels[gameName]["levels"];
        let difficulties = gameLevels[gameName]["difficulty"];
        let chosenLevel = null;
        let chosenDifficulty = null;

        let levelId = uuidv4();
        let difficultyId = uuidv4();
        let playId = uuidv4();
        let cancelId = uuidv4();
        let finishedEvent = new EventEmitter();
        
        // Get user to choose level and difficulty
        const levelSelect = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(levelId)
                    .setPlaceholder(`Choose a Level`)
                    .addOptions([levels])
            );

        const difficultySelect = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(difficultyId)
                    .setPlaceholder(`Choose a Difficulty`)
                    .addOptions([difficulties])
            );  

        const playButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(playId)
                    .setLabel('Play')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(cancelId)
                    .setLabel('Cancel')
                    .setStyle('DANGER')
            )

        const finishEmbed = new utils.embed(interaction, utils.user)
                .setTitle(`Game Over!`)

        if(!interaction.channel)
            await interaction.user.createDM();     
        
        await interaction.editReply({ 
            content: `Do you want to play ${gameLevels[gameName]["name"]}?`,
            components: [levelSelect, difficultySelect, playButtons] })
                .catch((e) => utils.consola.error(e));
        
        // If the user chooses an option
        const filter = i => (i.user.id === interaction.user.id && (i.customId == levelId || i.customId == difficultyId || i.customId == playId || i.customId == cancelId));
        const collector = interaction.channel.createMessageComponentCollector({ filter });
        collector.on('collect', async i => {
            await i.deferUpdate()
                .catch(e => utils.consola.error(e));

            switch(i.customId) {
                case levelId:
                    chosenLevel = i.values[0];
                    break;
                case difficultyId:
                    chosenDifficulty = i.values[0];
                    break;
                case playId:
                    collector.emit('end');
                    if(!chosenDifficulty)
                        chosenDifficulty = "Normal";
                    await gameToPlay.execute(interaction, utils, chosenLevel, chosenDifficulty, finishedEvent);
                    break;
                case cancelId:
                    collector.emit('end');
                    await utils.user.pause(false);
                    await interaction.editReply({ 
                        content: 'The game has been cancelled... ',
                        components: [] });
                    break;
            }

        });

        // When game is finished, add parts
        finishedEvent.once('finished', async (info) => {        

            const minutesDiff = parseInt(Math.abs(Date.now() - utils.user.minigame) / 60000);
            info.parts = Math.ceil(info.parts);

            // Only give parts if it has been 10 minutes
            if(minutesDiff < 10) {
                finishEmbed.setDescription(`You ${info.won ? "won!" : "lost!"}\nYou cannot earn any ${machinePartEmoji} from minigames for ⏰ \`${10 - minutesDiff} minutes\`.`)
            } else {
                finishEmbed.setDescription(`You ${info.won ? "won!" : "lost!"}\nYou got: \`x${info.parts}\` ${machinePartEmoji} Machine Parts!`)
                if(!await utils.db.add(interaction, "minigame")) {
                    await utils.user.pause(false); 
                    return;
                }
                if(info.parts > 0) {
                    if(!await utils.db.add(interaction, "balance", info.parts)) {
                        await utils.user.pause(false);
                        return;
                    } 
                }

            }

            // Add achievement
            let achievementIndex = 0;
            switch(chosenDifficulty) {
                case "Easy":
                    achievementIndex = 1;
                    break;
                case "Normal":
                    achievementIndex = 2;
                    break;
                case "Hard":
                    achievementIndex = 3;
                    break;
                default:
                    achievementIndex = 2;
                    break;
            }

            await utils.dbAchievements.editAchievement(interaction, utils.username, "Arcade Enthusiast", gameName, achievementIndex);
            await utils.user.pause(false);
                     
            await utils.userFile.writeUserLog(utils.user.username, `played minigame ${gameName} with difficulty ${chosenDifficulty} and level ${chosenLevel}. The reward was x${info.parts} Machine Parts.`);

            // Display ending message
            await interaction.editReply({
                embeds: [finishEmbed],
                components: [],
                content: ' ',
                files: []
            });

        });

    }

}