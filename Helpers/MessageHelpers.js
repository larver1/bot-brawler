const ErrorHandler = require("./ErrorHandler");
const { MessageActionRow, MessageButton } = require("discord.js");
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const consola = require("consola");
const sampleEmbed = require("./sampleEmbed");
const tickEmoji = "<a:tick:886245262169866260>";
const crossEmoji = "<a:cross:886245292339515412>";
const { Users } = require('../Database/dbObjects');

module.exports = class MessageHelpers {
    constructor() {
        this.replyEvent = new EventEmitter();
    }

    async findUser(interaction, differentID) {
		let idToFind = interaction.user.id;
		if(differentID) idToFind = differentID;
		const user = await Users.findOne({ where: { user_id: idToFind } });
		if(!user) {
			let err = new Error(`\`${interaction.user.tag}\`||(${idToFind})|| does not have a user account.${!differentID ? `\nIf this is your first time using Bot Brawler, please use \`/register\`.` : ``}`);
			await ErrorHandler.info(interaction, err);
		}

		return user;
    }

    // Gives user a yes/no option and emits event depending on choice
    async confirmChoice(interaction, user, msg, img) {

        let acceptId = uuidv4();
        let rejectId = uuidv4();

        let files = [];
        if(img) files = [img];

        if(msg.length <= 0) {
            let err = new Error(`The message given to MessageHelpers.confirmChoice() is empty.`);
            return ErrorHandler.error(interaction, err);
        }

        const dbUser = await this.findUser(interaction);
        if(!user)
            return;

        const request = new sampleEmbed(interaction, user)
            .setTitle(`Confirm your choice`)
            .setDescription(`${msg}`)

        const choices = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(acceptId)
                .setLabel('Accept')
                .setEmoji(`${tickEmoji}`)
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId(rejectId)
                .setLabel('Reject')
                .setEmoji(`${crossEmoji}`)
                .setStyle('SECONDARY')
        )

        if(!interaction.channel)
            await interaction.user.createDM();

        await interaction.editReply({ 
            content: `${user}, please choose an option.`,
            embeds: [request],
            components: [choices],
            files: files
        }).catch((e) => consola.error(e));

        const filter = i => {
            i.deferUpdate().catch(e => consola.error(e));
            return (i.user.id === user.id && (i.customId == acceptId || i.customId == rejectId));
        }

       const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, errors: ['time'] });
        let found = false;

        // If user presses either button
        collector.on('collect', async i => {
            switch(i.customId) {
                case acceptId:
                    this.replyEvent.emit(`accepted-${interaction.id}`);
                    found = true;
                    collector.emit('end');
                    break;
                case rejectId:
                    this.replyEvent.emit(`rejected-${interaction.id}`);
                    found = true;
                    collector.emit('end');                   
                    break;
                default:
                    break;
            }

        });

        // If button was never pressed
        collector.on('end', async () => {   
            if(!found) {
                this.replyEvent.emit(`timeOut-${interaction.id}`);
                await dbUser.pause(false);
                await interaction.editReply({
                    content: `${user} did not select an option in time.`,
                    components: []
                 }).catch((e) => consola.error(e));
            }
        });

    }

    // Provides interactive next/prev page functionality for lists of items
    async listPages(interaction, user, list, config) {
        let prevPageId = uuidv4();
        let nextPageId = uuidv4();

        let lines = list.split("\n");
        let linesPerPage = config.linesPerPage || 10;
        let pageList = [];
        let page = 0;
        let lineCount = 0;
        pageList[page] = '';

        for(let line = 0; line < lines.length; line++) {
            pageList[page] += `${lines[line]}\n`;

            lineCount++;
            if(lineCount >= linesPerPage) {
                page++;
                lineCount = 0;
                pageList[page] = '';
            }
        }

        let maxPages = pageList.length;
        page = 0;

        if(pageList[page].length <= 0) {
            let err = new Error(`The message given to MessageHelpers.listPages() is empty.`);
            return ErrorHandler.error(interaction, err);
        }
    
        const nextPage = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(prevPageId)
                        .setLabel('Prev Page: ')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId(nextPageId)
                        .setLabel('Next Page: ')
                        .setStyle('SECONDARY')
                )

        const display = new sampleEmbed(interaction, user)
            .setTitle(`${config.title ? config.title : 'List'} Page [${page + 1}/${maxPages}]`)
            .setDescription(`${pageList[page]}`)

        await interaction.editReply({ 
            embeds: [display], 
            components: [nextPage] }).catch((e) => consola.error(e));

        if(!interaction.channel)
            await interaction.user.createDM();

        const filter = i => (i.user.id === interaction.user.id && (i.customId == nextPageId || i.customId == prevPageId)); 
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000, errors: ['time'] });
		
        collector.on('collect', async i => { 

            await i.deferUpdate().catch(e => consola.error(e));

			//If they switched a page
			if(i.customId == nextPageId || i.customId == prevPageId) {
				if(i.customId == nextPageId) {
					if(page < maxPages - 1) page++;
					else page = 0;
				} else {
					if(page > 0) page--;
					else page = maxPages - 1;
				}

                display.setTitle(`${config.title ? config.title : 'List'} Page [${page + 1}/${maxPages}]`);
                display.setDescription(`${pageList[page]}`);

				return interaction.editReply({ 
                    embeds: [display], 
                    components: [nextPage] }).catch(e => { consola.error(e)});
                
			}

        });

        collector.on('end', async() => {
            await interaction.editReply({ components: [] }).catch(e => consola.error(e));
        });

    }
}