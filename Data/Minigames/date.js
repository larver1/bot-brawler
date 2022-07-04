const { MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');
const bots = JSON.parse(fs.readFileSync('./Data/Bots/botData.json')).filter((bot) => bot.dateStats);
const dateOptions = JSON.parse(fs.readFileSync('./Data/Minigames/Assets/dateOptions.json'))
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: "date",
    async execute(interaction, utils, level, difficulty, finishedEvent) {

        // Pick a bot
        let partner = bots[Math.floor(Math.random() * bots.length)];
        let success = 20;
        let turns = 10;
        let timedOut = true;

        if(level)
            partner = bots.find((bot) => bot.name == level);
        
        let dateStats = { ...partner.dateStats };
        let dateBehaviour = { ...partner.dateBehaviour };
        let behaviours = ["attention", "effort", "charmed", "interested"];
        let chosenBehaviour = behaviours[Math.floor(Math.random() * behaviours.length)]; 
        let previousChoice;

        switch(difficulty) {
            case "Easy":
                turns = 10;
                break;
            case "Normal":
                turns = 8;
                break;
            case "Hard":
                turns = 5;
                break;
            default:
                turns = 10;
                break;
        }

        // Embed
        const Date = new utils.embed(interaction, utils.user)
            .setTitle(`Date Night`)
            .setDescription(`${partner.name} ${dateBehaviour[chosenBehaviour]["low"]}\n\n**__Date score:__** ${success}%\n**__Time left:__**: ${turns} turns`)
            .setImage(partner.image)

        // Button IDs
        let complimentId = uuidv4();
        let insultId = uuidv4();
        let jokeId = uuidv4();
        let stuntId = uuidv4();
        let option1Id = uuidv4();
        let option2Id = uuidv4();
        let option3Id = uuidv4();
        let cancelId = uuidv4();

        // Button choices
        const Choices = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(complimentId)
                    .setLabel('Compliment')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(insultId)
                    .setLabel('Insult')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(jokeId)
                    .setLabel('Joke')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(stuntId)
                    .setLabel('Stunt')
                    .setStyle('PRIMARY'),
            )

        const Cancel = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(cancelId)
                .setLabel('Cancel')
                .setStyle('DANGER'),
        );

        await interaction.editReply({ 
                content: ' ',
                embeds: [Date], 
                components: [Choices] })
            .catch((e) => utils.consola.error(e));

        const filter = i => (i.user.id === interaction.user.id && (i.customId == complimentId || i.customId == insultId || i.customId == jokeId || i.customId == stuntId));
        const collector = interaction.channel.createMessageComponentCollector({ filter,  time: 600000, errors: ['time'] });

        collector.on('collect', async i => {
            await i.deferUpdate().catch(e => utils.consola.error(e));
            let actionBehaviour = "";
            let effectiveness = "";
            let dateOption;
            let choice;

            switch(i.customId) {
                case complimentId:
                    choice = "compliment";
                    actionBehaviour = dateBehaviour["attention"];
                    break;
                case insultId:
                    choice = "insult";
                    actionBehaviour = dateBehaviour["effort"];
                    break;
                case jokeId:
                    choice = "joke";
                    actionBehaviour = dateBehaviour["charmed"];
                    break;
                case stuntId:
                    choice = "stunt";
                    actionBehaviour = dateBehaviour["interested"];
                    break;
                default: 
                    break;
            }

            effectiveness = dateStats[choice];
            dateOption = dateOptions[choice];

            const Option1 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(option1Id)
                    .setLabel(dateOption[0])
                    .setStyle('PRIMARY'),
            );
            const Option2 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(option2Id)
                    .setLabel(dateOption[1])
                    .setStyle('PRIMARY'),
            );
            const Option3 = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(option3Id)
                    .setLabel(dateOption[2])
                    .setStyle('PRIMARY'),
            );

            
            await interaction.editReply({ embeds: [Date], components: [Option1, Option2, Option3, Cancel] })
                .catch((e) => utils.consola.error(e)); 

            const actionFilter = i2 => (i2.user.id === interaction.user.id && (i2.customId == option1Id || i2.customId == option2Id || i2.customId == option3Id));
            const actionCollector = interaction.channel.createMessageComponentCollector({ actionFilter });

            actionCollector.on('collect', async i2 => {
                await i2.deferUpdate().catch(e => utils.consola.error(e));
                let msg = ``;
                let effect = 0;
                let newChoice;

                switch(i2.customId) {
                    case option1Id:
                        effect = effectiveness[0];
                        newChoice = `${choice}:0`;
                        break;
                    case option2Id:
                        effect = effectiveness[1];
                        newChoice = `${choice}:1`;
                        break;
                    case option3Id:
                        effect = effectiveness[2];
                        newChoice = `${choice}:2`;
                        break;
                }

                if(chosenBehaviour && i2.customId != cancelId) {
                    if(dateBehaviour[chosenBehaviour] == actionBehaviour) {
                        msg = `You grabbed ${partner.name}'s attention.\n${partner.name} ${dateBehaviour[chosenBehaviour]["high"]}`;
                        chosenBehaviour = null;
                    } else {
                        msg = `It seems that ${choice}ing will not get their attention...\n\n${partner.name} ${dateBehaviour[chosenBehaviour]["low"]}`;
                    }
                } else if(i2.customId != cancelId) {

                    if(previousChoice == newChoice) {
                        msg = `${partner.name} wonders why you did the same thing twice in a row...`;
                        effect = 0;
                    } else if(effect > 0) {
                        msg = `${partner.name} seems to be amused by your ${choice}.`;
                    } else if(effect < 0) {
                        msg = `${partner.name} doesn't like your ${choice} very much.`;

                        // If bad choice, find a new behaviour
                        if(Math.random() > 0.5)  {
                            chosenBehaviour = behaviours[Math.floor(Math.random() * behaviours.length)];
                            msg += `\n\n${partner.name} ${dateBehaviour[chosenBehaviour]["low"]}`;
                        }
                    } else {
                        msg = `${partner.name} seems unaffected by your ${choice}.`;
                    }

                    success += effect;
                    
                }

                if(i2.customId != cancelId) {
                    turns--;
                    previousChoice = newChoice;
                    Date.setDescription(`${msg}\n\n**__Date score:__** ${success}%\n**__Time left:__**: ${turns} turns`)
                }

                actionCollector.emit('end');

                // Date is over
                if(turns <= 0 || success >= 100 || success <= 0) {
                    timedOut = false;
                    collector.emit('end');
                    return;
                }

                return interaction.editReply({ embeds: [Date], components: [Choices] })
                    .catch((e) => utils.consola.error(e)); 

            });    

        });

        collector.on('end', async () => {
                        
            let parts = (success / 10) + (turns * 2);

            switch(difficulty) {
                case "Normal":
                    parts *= 2;
                    break;
                case "Hard":
                    parts *= 3;
                    break;
                default:
                    break;
            }

            if(timedOut) {
                parts = 0;
            }

            finishedEvent.emit('finished', parts);
        });

    }
}