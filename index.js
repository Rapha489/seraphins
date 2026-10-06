require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;

const ADM_ROLE_ID = '1454153278060367933';
const OFFICIAL_SERVER_ID = '1401231514812809256';

const TICKET_BANNER_URL = 'https://cdn.imgchest.com/files/52cd34cf74ad.png';

const TICKET_TYPES = {
    parceria: 'Parceria',
    duvida: 'Dúvida',
    denuncia: 'Denúncia'
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.GuildMember,
        Partials.User
    ]
});

const DATA_DIR = __dirname;

function loadJSON(file, fallback = {}) {
    const filePath = path.join(DATA_DIR, file);

    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
            return fallback;
        }

        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Erro ao carregar ${file}:`, error);
        return fallback;
    }
}

function saveJSON(file, data) {
    try {
        fs.writeFileSync(
            path.join(DATA_DIR, file),
            JSON.stringify(data, null, 2)
        );
    } catch (error) {
        console.error(`Erro ao salvar ${file}:`, error);
    }
}

const advertencias = loadJSON('advertencias.json', {});
const sorteios = loadJSON('sorteios.json', {});
const convites = loadJSON('convites.json', {});

const guildConfigs = {};

function getConfig(guildId) {
    if (!guildConfigs[guildId]) {
        guildConfigs[guildId] = {
            ticketCanal: null,
            ticketCategoria: null,
            ticketCargo: ADM_ROLE_ID,
            antiSpam: false,
            antiRaid: false
        };
    }

    return guildConfigs[guildId];
}

function isStaff(member) {
    if (!member) return false;

    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.roles.cache.has(ADM_ROLE_ID)
    );
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);

    return `${hours}h`;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/* =========================
   PAINEL PRINCIPAL
========================= */

function mainPanel() {
    const embed = new EmbedBuilder()
        .setTitle('Seraphins')
        .setDescription(
            'Painel de gerenciamento do servidor\n\n' +
            'Escolha uma categoria abaixo para acessar as funções disponíveis.'
        )
        .setColor('#000000');

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_mod')
            .setLabel('Moderação')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('panel_ticket')
            .setLabel('Tickets')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('panel_protection')
            .setLabel('Proteção')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('panel_giveaway')
            .setLabel('Sorteios')
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('panel_server')
            .setLabel('Servidor')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('panel_fun')
            .setLabel('Diversão')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('panel_config')
            .setLabel('Configurações')
            .setEmoji('⚙️')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row1, row2]
    };
}

/* =========================
   MODERAÇÃO
========================= */

function moderationPanel() {
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Moderação')
        .setDescription(
            'Ferramentas de moderação do servidor.\n\n' +
            'Selecione uma ação abaixo.'
        )
        .setColor('#000000');

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_ban')
            .setLabel('Banir')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('mod_kick')
            .setLabel('Expulsar')
            .setEmoji('👢')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('mod_timeout')
            .setLabel('Timeout')
            .setEmoji('⏱️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('mod_untimeout')
            .setLabel('Remover Timeout')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_warn')
            .setLabel('Advertir')
            .setEmoji('⚠️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('mod_warns')
            .setLabel('Advertências')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('mod_delwarn')
            .setLabel('Remover Advertência')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('mod_lock')
            .setLabel('Bloquear Canal')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('mod_unlock')
            .setLabel('Desbloquear Canal')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_slowmode')
            .setLabel('Slowmode')
            .setEmoji('🐢')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row1, row2, row3]
    };
}

function moderationModal(type) {
    const modal = new ModalBuilder();

    const userInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID do usuário')
        .setPlaceholder('Digite o ID do usuário')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Motivo')
        .setPlaceholder('Digite o motivo')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    if (type === 'ban') {
        modal
            .setCustomId('modal_ban')
            .setTitle('Banir usuário')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );
    }

    if (type === 'kick') {
        modal
            .setCustomId('modal_kick')
            .setTitle('Expulsar usuário')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );
    }

    if (type === 'timeout') {
        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duração em segundos')
            .setPlaceholder('Ex: 60')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal
            .setCustomId('modal_timeout')
            .setTitle('Aplicar timeout')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );
    }

    if (type === 'untimeout') {
        modal
            .setCustomId('modal_untimeout')
            .setTitle('Remover timeout')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );
    }

    if (type === 'warn') {
        modal
            .setCustomId('modal_warn')
            .setTitle('Advertir usuário')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );
    }

    if (type === 'warns') {
        modal
            .setCustomId('modal_warns')
            .setTitle('Ver advertências')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput)
            );
    }

    if (type === 'delwarn') {
        modal
            .setCustomId('modal_delwarn')
            .setTitle('Remover advertência')
            .addComponents(
                new ActionRowBuilder().addComponents(userInput)
            );
    }

    return modal;
}

/* =========================
   TICKETS
========================= */

function ticketPanel() {
    const embed = new EmbedBuilder()
        .setTitle('Tickets')
        .setDescription(
            'Configure o sistema de tickets do Seraphins.\n\n' +
            '**Canal:** onde o painel será enviado\n' +
            '**Categoria:** onde os tickets serão criados\n' +
            '**Cargo ADM:** quem terá acesso aos tickets'
        )
        .setColor('#000000');

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_set_channel')
            .setLabel('Definir Canal')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('ticket_set_category')
            .setLabel('Definir Categoria')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('ticket_set_role')
            .setLabel('Definir Cargo ADM')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_send_panel')
            .setLabel('Enviar Painel de Suporte')
            .setStyle(ButtonStyle.Success)
    );

    return {
        embeds: [embed],
        components: [row1, row2]
    };
}

function ticketOpenPanel() {
    const embed = new EmbedBuilder()
        .setTitle('Suporte')
        .setDescription(
            'Precisa de ajuda?\n\n' +
            'Escolha abaixo o tipo de atendimento que você precisa.\n\n' +
            '**Parceria**\n' +
            'Para assuntos relacionados a parcerias.\n\n' +
            '**Dúvida**\n' +
            'Para tirar dúvidas ou pedir ajuda.\n\n' +
            '**Denúncia**\n' +
            'Para denunciar usuários ou situações.'
        )
        .setColor('#000000');

    if (
        TICKET_BANNER_URL &&
        TICKET_BANNER_URL !== 'COLE_AQUI_O_LINK_DO_BANNER'
    ) {
        embed.setImage(TICKET_BANNER_URL);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('open_ticket_parceria')
            .setLabel('Parceria')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('open_ticket_duvida')
            .setLabel('Dúvida')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('open_ticket_denuncia')
            .setLabel('Denúncia')
            .setStyle(ButtonStyle.Danger)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

async function openTicket(interaction, type = 'duvida') {
    const guild = interaction.guild;
    const cfg = getConfig(guild.id);

    const ticketType = TICKET_TYPES[type] || TICKET_TYPES.duvida;

    const existing = guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildText &&
            channel.topic === `seraphins-ticket:${interaction.user.id}`
    );

    if (existing) {
        return interaction.reply({
            content: `Você já possui um ticket aberto: ${existing}`,
            ephemeral: true
        });
    }

    const category = cfg.ticketCategoria
        ? guild.channels.cache.get(cfg.ticketCategoria)
        : null;

    const role = guild.roles.cache.get(
        cfg.ticketCargo || ADM_ROLE_ID
    );

    let username = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50);

    if (!username) {
        username = 'usuario';
    }

    const channel = await guild.channels.create({
        name: `${type}-${username}`.slice(0, 100),
        type: ChannelType.GuildText,
        parent:
            category?.type === ChannelType.GuildCategory
                ? category.id
                : undefined,
        topic: `seraphins-ticket:${interaction.user.id}`,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [
                    PermissionFlagsBits.ViewChannel
                ]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            }
        ]
    });

    if (role) {
        await channel.permissionOverwrites.create(role.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Suporte • ${ticketType}`)
        .setDescription(
            `Olá ${interaction.user}!\n\n` +
            `Seu atendimento foi aberto na categoria **${ticketType}**.\n\n` +
            'Explique sua situação abaixo.\n' +
            'Um membro da equipe irá atendê-lo.\n\n' +
            '**Assumir Ticket**\n' +
            '**Chamar ADM**\n' +
            '**Fechar Ticket**'
        )
        .setColor('#000000');

    if (
        TICKET_BANNER_URL &&
        TICKET_BANNER_URL !== 'COLE_AQUI_O_LINK_DO_BANNER'
    ) {
        embed.setImage(TICKET_BANNER_URL);
    }

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel('Assumir Ticket')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('ticket_call_adm')
            .setLabel('Chamar ADM')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        content: role
            ? `${role} ${interaction.user}`
            : `${interaction.user}`,
        embeds: [embed],
        components: [buttons]
    });

    return interaction.reply({
        content: `Ticket de ${ticketType} criado: ${channel}`,
        ephemeral: true
    });
}

/* =========================
   SERVIDOR
========================= */

function serverPanel(guild) {
    const humans = guild.members.cache.filter(
        member => !member.user.bot
    ).size;

    const bots = guild.members.cache.filter(
        member => member.user.bot
    ).size;

    const embed = new EmbedBuilder()
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setColor('#000000')
        .addFields(
            {
                name: '👥 Membros',
                value: `${guild.memberCount}`,
                inline: true
            },
            {
                name: '👤 Humanos',
                value: `${humans}`,
                inline: true
            },
            {
                name: '🤖 Bots',
                value: `${bots}`,
                inline: true
            },
            {
                name: '💬 Canais',
                value: `${guild.channels.cache.size}`,
                inline: true
            },
            {
                name: '🎭 Cargos',
                value: `${guild.roles.cache.size}`,
                inline: true
            },
            {
                name: '🚀 Boosts',
                value: `${guild.premiumSubscriptionCount || 0}`,
                inline: true
            },
            {
                name: '👑 Dono',
                value: `<@${guild.ownerId}>`,
                inline: true
            },
            {
                name: '📅 Criado em',
                value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
                inline: true
            },
            {
                name: '🆔 ID',
                value: guild.id,
                inline: true
            }
        );

    return {
        embeds: [embed]
    };
}

/* =========================
   DIVERSÃO
========================= */

function funPanel() {
    const embed = new EmbedBuilder()
        .setTitle('🎉 Diversão')
        .setDescription(
            'Escolha uma das opções abaixo.'
        )
        .setColor('#000000');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('fun_dice')
            .setLabel('Dado')
            .setEmoji('🎲')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('fun_coin')
            .setLabel('Moeda')
            .setEmoji('🪙')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('fun_8ball')
            .setLabel('8Ball')
            .setEmoji('🎱')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('fun_number')
            .setLabel('Número')
            .setEmoji('🔢')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('fun_choose')
            .setLabel('Escolher')
            .setEmoji('🃏')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('fun_quiz')
            .setLabel('Quiz')
            .setEmoji('🏆')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

/* =========================
   CONFIGURAÇÕES
========================= */

function configPanel(guild) {
    const cfg = getConfig(guild.id);

    const embed = new EmbedBuilder()
        .setTitle('⚙️ Configurações')
        .setDescription('Configurações atuais do Seraphins.')
        .setColor('#000000')
        .addFields(
            {
                name: 'Canal de Tickets',
                value: cfg.ticketCanal
                    ? `<#${cfg.ticketCanal}>`
                    : 'Não definido',
                inline: true
            },
            {
                name: 'Categoria',
                value: cfg.ticketCategoria
                    ? `<#${cfg.ticketCategoria}>`
                    : 'Não definida',
                inline: true
            },
            {
                name: 'Cargo ADM',
                value: cfg.ticketCargo
                    ? `<@&${cfg.ticketCargo}>`
                    : 'Não definido',
                inline: true
            },
            {
                name: '🛡️ Anti-Spam',
                value: cfg.antiSpam ? 'Ativado' : 'Desativado',
                inline: true
            },
            {
                name: '🚨 Anti-Raid',
                value: cfg.antiRaid ? 'Ativado' : 'Desativado',
                inline: true
            }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('config_tickets')
            .setLabel('Tickets')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('config_protection')
            .setLabel('Proteção')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

/* =========================
   PROTEÇÃO
========================= */

function protectionPanel(guild) {
    const cfg = getConfig(guild.id);

    const embed = new EmbedBuilder()
        .setTitle('🛡️ Proteção')
        .setDescription(
            'Configure os sistemas de proteção do servidor.'
        )
        .setColor('#000000')
        .addFields(
            {
                name: 'Anti-Spam',
                value: cfg.antiSpam
                    ? '🟢 Ativado'
                    : '🔴 Desativado',
                inline: true
            },
            {
                name: 'Anti-Raid',
                value: cfg.antiRaid
                    ? '🟢 Ativado'
                    : '🔴 Desativado',
                inline: true
            }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('toggle_spam')
            .setLabel('Alternar Anti-Spam')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('toggle_raid')
            .setLabel('Alternar Anti-Raid')
            .setStyle(ButtonStyle.Danger)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

/* =========================
   SORTEIOS
========================= */

function giveawayPanel() {
    const embed = new EmbedBuilder()
        .setTitle('🎁 Sorteios')
        .setDescription(
            'Gerencie os sorteios do servidor.'
        )
        .setColor('#000000');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('giveaway_create')
            .setLabel('Criar Sorteio')
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('giveaway_active')
            .setLabel('Sorteios Ativos')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

function giveawayCreateModal() {
    const modal = new ModalBuilder()
        .setCustomId('modal_giveaway')
        .setTitle('Criar Sorteio');

    const prize = new TextInputBuilder()
        .setCustomId('prize')
        .setLabel('Prêmio')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const duration = new TextInputBuilder()
        .setCustomId('duration')
        .setLabel('Duração em minutos')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const winners = new TextInputBuilder()
        .setCustomId('winners')
        .setLabel('Quantidade de vencedores')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    return modal.addComponents(
        new ActionRowBuilder().addComponents(prize),
        new ActionRowBuilder().addComponents(duration),
        new ActionRowBuilder().addComponents(winners)
    );
}

function giveawayMessage(giveaway) {
    return new EmbedBuilder()
        .setTitle('🎁 Sorteio')
        .setDescription(
            `**Prêmio:** ${giveaway.prize}\n\n` +
            `Clique no botão abaixo para participar.\n\n` +
            `**Vencedores:** ${giveaway.winners}\n` +
            `**Termina:** <t:${Math.floor(giveaway.end / 1000)}:R>`
        )
        .setColor('#000000');
}

/* =========================
   CONVITES
========================= */

async function loadInvites(guild) {
    try {
        const invites = await guild.invites.fetch();

        convites[guild.id] = {};

        invites.forEach(invite => {
            convites[guild.id][invite.code] = {
                uses: invite.uses || 0,
                inviter: invite.inviter?.id || null
            };
        });

        saveJSON('convites.json', convites);
    } catch (error) {
        console.log(`Não foi possível carregar convites de ${guild.name}`);
    }
}

async function getUserInvites(guild, userId) {
    let total = 0;

    try {
        const invites = await guild.invites.fetch();

        invites.forEach(invite => {
            if (invite.inviter?.id === userId) {
                total += invite.uses || 0;
            }
        });
    } catch {}

    return total;
}

/* =========================
   EVENTOS DE MEMBROS
========================= */

const raidTracker = new Map();

client.on('guildMemberAdd', async member => {
    const guildId = member.guild.id;
    const cfg = getConfig(guildId);

    if (!cfg.antiRaid) return;

    if (!raidTracker.has(guildId)) {
        raidTracker.set(guildId, []);
    }

    const now = Date.now();

    const joins = raidTracker
        .get(guildId)
        .filter(timestamp => now - timestamp < 10000);

    joins.push(now);

    raidTracker.set(guildId, joins);

    if (joins.length >= 10) {
        const verificationRole =
            member.guild.roles.cache.find(role =>
                role.name.toLowerCase().includes('verificação')
            );

        if (verificationRole) {
            try {
                await member.roles.add(verificationRole);
            } catch {}
        }
    }
});

/* =========================
   READY
========================= */

client.once('clientReady', async () => {
    console.log(`🤖 ${client.user.tag} está online!`);

    client.user.setActivity(
        'Painel do servidor',
        {
            type: 3
        }
    );

    for (const guild of client.guilds.cache.values()) {
        await loadInvites(guild);
    }

    console.log('📨 Sistema de convites carregado.');
});

/* =========================
   COMANDOS
========================= */

const commands = [
    {
        name: 'ping',
        description: 'Verifica a latência do bot'
    },
    {
        name: 'painel',
        description: 'Abre o painel do Seraphins'
    },
    {
        name: 'setupticket',
        description: 'Envia o painel de suporte',
        options: [
            {
                name: 'canal',
                description: 'Canal onde o painel será enviado',
                type: 7,
                required: true
            }
        ]
    },
    {
        name: 'convites',
        description: 'Mostra os convites de um usuário',
        options: [
            {
                name: 'usuario',
                description: 'Usuário',
                type: 6,
                required: false
            }
        ]
    }
];

client.once('clientReady', async () => {
    try {
        await client.application.commands.set(commands);
        console.log('✅ Comandos registrados!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
});

/* =========================
   INTERAÇÕES
========================= */

client.on('interactionCreate', async interaction => {
    try {
        /* ===== SLASH COMMANDS ===== */

        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'ping') {
                return interaction.reply({
                    content: `Pong! ${client.ws.ping}ms`,
                    ephemeral: true
                });
            }

            if (interaction.commandName === 'painel') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Você não possui permissão para usar este comando.',
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    ...mainPanel(),
                    ephemeral: true
                });
            }

            if (interaction.commandName === 'setupticket') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: 'Você não possui permissão para configurar o suporte.',
                        ephemeral: true
                    });
                }

                const canal =
                    interaction.options.getChannel('canal');

                if (!canal) {
                    return interaction.reply({
                        content: 'Canal inválido.',
                        ephemeral: true
                    });
                }

                const permissions =
                    canal.permissionsFor(client.user);

                if (
                    !permissions ||
                    !permissions.has(PermissionFlagsBits.ViewChannel) ||
                    !permissions.has(PermissionFlagsBits.SendMessages) ||
                    !permissions.has(PermissionFlagsBits.EmbedLinks)
                ) {
                    return interaction.reply({
                        content:
                            'Eu não tenho as permissões necessárias nesse canal.',
                        ephemeral: true
                    });
                }

                const cfg = getConfig(interaction.guild.id);

                cfg.ticketCanal = canal.id;

                try {
                    await canal.send(ticketOpenPanel());

                    return interaction.reply({
                        content:
                            `Painel de suporte enviado em ${canal}.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(
                        'Erro ao enviar painel de suporte:',
                        error
                    );

                    return interaction.reply({
                        content:
                            'Não foi possível enviar o painel nesse canal.',
                        ephemeral: true
                    });
                }
            }

            if (interaction.commandName === 'convites') {
                const user =
                    interaction.options.getUser('usuario') ||
                    interaction.user;

                const total = await getUserInvites(
                    interaction.guild,
                    user.id
                );

                return interaction.reply({
                    content:
                        `${user} possui **${total}** convite(s).`
                });
            }
        }

        /* ===== PAINEL PRINCIPAL ===== */

        if (interaction.isButton()) {
            if (interaction.customId === 'panel_mod') {
                return interaction.update(
                    moderationPanel()
                );
            }

            if (interaction.customId === 'panel_ticket') {
                return interaction.update(
                    ticketPanel()
                );
            }

            if (interaction.customId === 'panel_protection') {
                return interaction.update(
                    protectionPanel(interaction.guild)
                );
            }

            if (interaction.customId === 'panel_giveaway') {
                return interaction.update(
                    giveawayPanel()
                );
            }

            if (interaction.customId === 'panel_server') {
                return interaction.update(
                    serverPanel(interaction.guild)
                );
            }

            if (interaction.customId === 'panel_fun') {
                return interaction.update(
                    funPanel()
                );
            }

            if (interaction.customId === 'panel_config') {
                return interaction.update(
                    configPanel(interaction.guild)
                );
            }

            /* ===== MODERAÇÃO ===== */

            if (
                [
                    'mod_ban',
                    'mod_kick',
                    'mod_timeout',
                    'mod_untimeout',
                    'mod_warn',
                    'mod_warns',
                    'mod_delwarn'
                ].includes(interaction.customId)
            ) {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content:
                            '❌ Você não possui permissão para isso.',
                        ephemeral: true
                    });
                }

                const type =
                    interaction.customId.replace('mod_', '');

                return interaction.showModal(
                    moderationModal(type)
                );
            }

            if (interaction.customId === 'mod_lock') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                await interaction.channel.permissionOverwrites.edit(
                    interaction.guild.roles.everyone,
                    {
                        SendMessages: false
                    }
                );

                return interaction.reply(
                    '🔒 Canal bloqueado.'
                );
            }

            if (interaction.customId === 'mod_unlock') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                await interaction.channel.permissionOverwrites.edit(
                    interaction.guild.roles.everyone,
                    {
                        SendMessages: null
                    }
                );

                return interaction.reply(
                    '🔓 Canal desbloqueado.'
                );
            }

            if (interaction.customId === 'mod_slowmode') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                await interaction.channel.setRateLimitPerUser(10);

                return interaction.reply(
                    '🐢 Slowmode definido para 10 segundos.'
                );
            }

            /* ===== CONFIGURAÇÃO DE TICKETS ===== */

            if (interaction.customId === 'ticket_set_channel') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: 'Sem permissão.',
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('modal_ticket_channel')
                    .setTitle('Definir canal de suporte');

                const input = new TextInputBuilder()
                    .setCustomId('channel_id')
                    .setLabel('ID do canal')
                    .setPlaceholder('Digite o ID do canal')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(input)
                );

                return interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_set_category') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: 'Sem permissão.',
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('modal_ticket_category')
                    .setTitle('Definir categoria');

                const input = new TextInputBuilder()
                    .setCustomId('category_id')
                    .setLabel('ID da categoria')
                    .setPlaceholder('Digite o ID da categoria')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(input)
                );

                return interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_set_role') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: 'Sem permissão.',
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('modal_ticket_role')
                    .setTitle('Definir cargo ADM');

                const input = new TextInputBuilder()
                    .setCustomId('role_id')
                    .setLabel('ID do cargo')
                    .setPlaceholder('Digite o ID do cargo')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(input)
                );

                return interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_send_panel') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: 'Sem permissão.',
                        ephemeral: true
                    });
                }

                const cfg = getConfig(interaction.guild.id);

                if (!cfg.ticketCanal) {
                    return interaction.reply({
                        content:
                            'Defina o canal do painel primeiro.',
                        ephemeral: true
                    });
                }

                const channel =
                    interaction.guild.channels.cache.get(
                        cfg.ticketCanal
                    );

                if (!channel) {
                    return interaction.reply({
                        content:
                            'O canal configurado não existe.',
                        ephemeral: true
                    });
                }

                const permissions =
                    channel.permissionsFor(client.user);

                if (
                    !permissions ||
                    !permissions.has(PermissionFlagsBits.ViewChannel) ||
                    !permissions.has(PermissionFlagsBits.SendMessages) ||
                    !permissions.has(PermissionFlagsBits.EmbedLinks)
                ) {
                    return interaction.reply({
                        content:
                            'Eu não tenho as permissões necessárias nesse canal.',
                        ephemeral: true
                    });
                }

                await channel.send(ticketOpenPanel());

                return interaction.reply({
                    content:
                        'Painel de suporte enviado.',
                    ephemeral: true
                });
            }

            /* ===== ABERTURA DOS TICKETS ===== */

            if (
                interaction.customId === 'open_ticket_parceria'
            ) {
                return openTicket(
                    interaction,
                    'parceria'
                );
            }

            if (
                interaction.customId === 'open_ticket_duvida'
            ) {
                return openTicket(
                    interaction,
                    'duvida'
                );
            }

            if (
                interaction.customId === 'open_ticket_denuncia'
            ) {
                return openTicket(
                    interaction,
                    'denuncia'
                );
            }

            /* Compatibilidade com botão antigo */

            if (interaction.customId === 'open_ticket') {
                return openTicket(
                    interaction,
                    'duvida'
                );
            }

            /* ===== AÇÕES DOS TICKETS ===== */

            if (interaction.customId === 'ticket_claim') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content:
                            'Você não possui permissão para assumir este ticket.',
                        ephemeral: true
                    });
                }

                return interaction.reply(
                    `${interaction.user} assumiu este ticket.`
                );
            }

            if (interaction.customId === 'ticket_call_adm') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content:
                            'Você não possui permissão para chamar a equipe.',
                        ephemeral: true
                    });
                }

                const roleId =
                    getConfig(interaction.guild.id).ticketCargo ||
                    ADM_ROLE_ID;

                const role =
                    interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({
                        content:
                            'O cargo ADM não está configurado.',
                        ephemeral: true
                    });
                }

                const menu =
                    new StringSelectMenuBuilder()
                        .setCustomId('select_ticket_adm')
                        .setPlaceholder('Escolha um ADM')
                        .addOptions(
                            interaction.guild.members.cache
                                .filter(member =>
                                    member.roles.cache.has(role.id)
                                )
                                .first(25)
                                .map(member =>
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            member.user.username
                                        )
                                        .setValue(
                                            member.id
                                        )
                                )
                        );

                return interaction.reply({
                    content:
                        'Escolha o ADM que deseja chamar.',
                    components: [
                        new ActionRowBuilder().addComponents(
                            menu
                        )
                    ],
                    ephemeral: true
                });
            }

            if (interaction.customId === 'ticket_close') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content:
                            'Você não possui permissão para fechar este ticket.',
                        ephemeral: true
                    });
                }

                await interaction.reply(
                    'Ticket será fechado em **5 segundos**...'
                );

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch {}
                }, 5000);

                return;
            }

            /* ===== PROTEÇÃO ===== */

            if (interaction.customId === 'toggle_spam') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                const cfg =
                    getConfig(interaction.guild.id);

                cfg.antiSpam = !cfg.antiSpam;

                return interaction.update(
                    protectionPanel(interaction.guild)
                );
            }

            if (interaction.customId === 'toggle_raid') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                const cfg =
                    getConfig(interaction.guild.id);

                cfg.antiRaid = !cfg.antiRaid;

                return interaction.update(
                    protectionPanel(interaction.guild)
                );
            }

            /* ===== SORTEIOS ===== */

            if (interaction.customId === 'giveaway_create') {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                return interaction.showModal(
                    giveawayCreateModal()
                );
            }

            if (interaction.customId === 'giveaway_active') {
                const active =
                    Object.values(sorteios).filter(
                        giveaway =>
                            giveaway.guildId ===
                                interaction.guild.id &&
                            giveaway.end > Date.now()
                    );

                if (!active.length) {
                    return interaction.reply({
                        content:
                            'Não existem sorteios ativos.',
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    content: active
                        .map(
                            giveaway =>
                                `🎁 **${giveaway.prize}** — <t:${Math.floor(
                                    giveaway.end / 1000
                                )}:R>`
                        )
                        .join('\n'),
                    ephemeral: true
                });
            }

            /* ===== DIVERSÃO ===== */

            if (interaction.customId === 'fun_dice') {
                const number =
                    Math.floor(Math.random() * 6) + 1;

                return interaction.reply(
                    `🎲 Você tirou **${number}**!`
                );
            }

            if (interaction.customId === 'fun_coin') {
                return interaction.reply(
                    `🪙 Deu **${randomItem([
                        'cara',
                        'coroa'
                    ])}**!`
                );
            }

            if (interaction.customId === 'fun_8ball') {
                return interaction.reply(
                    `🎱 ${randomItem([
                        'Sim.',
                        'Não.',
                        'Talvez.',
                        'Com certeza.',
                        'Provavelmente.',
                        'Não conte com isso.'
                    ])}`
                );
            }

            if (interaction.customId === 'fun_number') {
                return interaction.reply(
                    `🔢 Número escolhido: **${Math.floor(
                        Math.random() * 100
                    ) + 1}**`
                );
            }

            if (interaction.customId === 'fun_choose') {
                return interaction.reply({
                    content:
                        '🃏 Use `/escolher` quando disponível.',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'fun_quiz') {
                return interaction.reply(
                    `🏆 ${randomItem([
                        'Você consegue!',
                        'Boa sorte!',
                        'Hora do desafio!',
                        'Mostre o que você sabe!'
                    ])}`
                );
            }
        }

        /* ===== SELECT MENU ===== */

        if (interaction.isStringSelectMenu()) {
            if (
                interaction.customId ===
                'select_ticket_adm'
            ) {
                const memberId =
                    interaction.values[0];

                const member =
                    interaction.guild.members.cache.get(
                        memberId
                    );

                if (!member) {
                    return interaction.update({
                        content:
                            'ADM não encontrado.',
                        components: []
                    });
                }

                return interaction.update({
                    content:
                        `${member} foi chamado para este ticket!`,
                    components: []
                });
            }
        }

        /* ===== MODAIS ===== */

        if (interaction.isModalSubmit()) {
            /* MODERAÇÃO */

            if (
                [
                    'modal_ban',
                    'modal_kick',
                    'modal_timeout',
                    'modal_untimeout',
                    'modal_warn',
                    'modal_warns',
                    'modal_delwarn'
                ].includes(interaction.customId)
            ) {
                if (!isStaff(interaction.member)) {
                    return interaction.reply({
                        content:
                            '❌ Sem permissão.',
                        ephemeral: true
                    });
                }

                const userId =
                    interaction.fields.getTextInputValue(
                        'user_id'
                    );

                const reason =
                    interaction.fields.fields.has('reason')
                        ? interaction.fields.getTextInputValue(
                              'reason'
                          ) || 'Nenhum motivo informado'
                        : 'Nenhum motivo informado';

                const guild =
                    interaction.guild;

                if (
                    interaction.customId ===
                    'modal_warn'
                ) {
                    if (!advertencias[guild.id]) {
                        advertencias[guild.id] = {};
                    }

                    if (
                        !advertencias[guild.id][
                            userId
                        ]
                    ) {
                        advertencias[guild.id][
                            userId
                        ] = [];
                    }

                    advertencias[guild.id][userId].push({
                        reason,
                        moderator:
                            interaction.user.id,
                        timestamp: Date.now()
                    });

                    saveJSON(
                        'advertencias.json',
                        advertencias
                    );

                    return interaction.reply(
                        `⚠️ Usuário <@${userId}> recebeu uma advertência.`
                    );
                }

                if (
                    interaction.customId ===
                    'modal_warns'
                ) {
                    const warns =
                        advertencias[guild.id]?.[
                            userId
                        ] || [];

                    if (!warns.length) {
                        return interaction.reply(
                            `📋 <@${userId}> não possui advertências.`
                        );
                    }

                    return interaction.reply(
                        `📋 <@${userId}> possui **${warns.length}** advertência(s).`
                    );
                }

                if (
                    interaction.customId ===
                    'modal_delwarn'
                ) {
                    const warns =
                        advertencias[guild.id]?.[
                            userId
                        ] || [];

                    if (!warns.length) {
                        return interaction.reply(
                            `O usuário <@${userId}> não possui advertências.`
                        );
                    }

                    warns.pop();

                    saveJSON(
                        'advertencias.json',
                        advertencias
                    );

                    return interaction.reply(
                        `🗑️ A última advertência de <@${userId}> foi removida.`
                    );
                }

                const member =
                    await guild.members.fetch(
                        userId
                    ).catch(() => null);

                if (!member) {
                    return interaction.reply({
                        content:
                            '❌ Usuário não encontrado no servidor.',
                        ephemeral: true
                    });
                }

                if (
                    interaction.customId ===
                    'modal_kick'
                ) {
                    await member.kick(reason);

                    return interaction.reply(
                        `👢 ${member.user.tag} foi expulso.`
                    );
                }

                if (
                    interaction.customId ===
                    'modal_ban'
                ) {
                    await member.ban({
                        reason
                    });

                    return interaction.reply(
                        `🔨 ${member.user.tag} foi banido.`
                    );
                }

                if (
                    interaction.customId ===
                    'modal_timeout'
                ) {
                    const duration =
                        Number(
                            interaction.fields.getTextInputValue(
                                'duration'
                            )
                        );

                    if (
                        !Number.isFinite(duration) ||
                        duration <= 0
                    ) {
                        return interaction.reply({
                            content:
                                '❌ Duração inválida.',
                            ephemeral: true
                        });
                    }

                    await member.timeout(
                        duration * 1000,
                        reason
                    );

                    return interaction.reply(
                        `⏱️ ${member.user.tag} recebeu timeout por ${duration}s.`
                    );
                }

                if (
                    interaction.customId ===
                    'modal_untimeout'
                ) {
                    await member.timeout(
                        null,
                        reason
                    );

                    return interaction.reply(
                        `🔓 Timeout de ${member.user.tag} removido.`
                    );
                }
            }

            /* TICKET - CANAL */

            if (
                interaction.customId ===
                'modal_ticket_channel'
            ) {
                const id =
                    interaction.fields.getTextInputValue(
                        'channel_id'
                    );

                const channel =
                    interaction.guild.channels.cache.get(
                        id
                    );

                if (
                    !channel ||
                    channel.type !==
                        ChannelType.GuildText
                ) {
                    return interaction.reply({
                        content:
                            'Canal inválido.',
                        ephemeral: true
                    });
                }

                getConfig(
                    interaction.guild.id
                ).ticketCanal = id;

                return interaction.reply({
                    content:
                        `Canal de suporte definido como ${channel}.`,
                    ephemeral: true
                });
            }

            /* TICKET - CATEGORIA */

            if (
                interaction.customId ===
                'modal_ticket_category'
            ) {
                const id =
                    interaction.fields.getTextInputValue(
                        'category_id'
                    );

                const category =
                    interaction.guild.channels.cache.get(
                        id
                    );

                if (
                    !category ||
                    category.type !==
                        ChannelType.GuildCategory
                ) {
                    return interaction.reply({
                        content:
                            'Categoria inválida.',
                        ephemeral: true
                    });
                }

                getConfig(
                    interaction.guild.id
                ).ticketCategoria = id;

                return interaction.reply({
                    content:
                        `Categoria definida como ${category}.`,
                    ephemeral: true
                });
            }

            /* TICKET - CARGO */

            if (
                interaction.customId ===
                'modal_ticket_role'
            ) {
                const id =
                    interaction.fields.getTextInputValue(
                        'role_id'
                    );

                const role =
                    interaction.guild.roles.cache.get(
                        id
                    );

                if (!role) {
                    return interaction.reply({
                        content:
                            'Cargo inválido.',
                        ephemeral: true
                    });
                }

                getConfig(
                    interaction.guild.id
                ).ticketCargo = id;

                return interaction.reply({
                    content:
                        `Cargo ADM definido como ${role}.`,
                    ephemeral: true
                });
            }

            /* SORTEIO */

            if (
                interaction.customId ===
                'modal_giveaway'
            ) {
                const prize =
                    interaction.fields.getTextInputValue(
                        'prize'
                    );

                const duration =
                    Number(
                        interaction.fields.getTextInputValue(
                            'duration'
                        )
                    );

                const winners =
                    Number(
                        interaction.fields.getTextInputValue(
                            'winners'
                        )
                    );

                if (
                    !Number.isFinite(duration) ||
                    duration <= 0 ||
                    !Number.isFinite(winners) ||
                    winners <= 0
                ) {
                    return interaction.reply({
                        content:
                            '❌ Valores inválidos.',
                        ephemeral: true
                    });
                }

                const giveawayId =
                    `${interaction.guild.id}-${Date.now()}`;

                const giveaway = {
                    id: giveawayId,
                    guildId:
                        interaction.guild.id,
                    channelId:
                        interaction.channel.id,
                    prize,
                    winners,
                    end:
                        Date.now() +
                        duration * 60000,
                    participants: []
                };

                sorteios[giveawayId] =
                    giveaway;

                saveJSON(
                    'sorteios.json',
                    sorteios
                );

                const message =
                    await interaction.channel.send({
                        embeds: [
                            giveawayMessage(
                                giveaway
                            )
                        ],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId(
                                        `giveaway_join_${giveawayId}`
                                    )
                                    .setLabel(
                                        'Participar'
                                    )
                                    .setEmoji('🎁')
                                    .setStyle(
                                        ButtonStyle.Success
                                    )
                            )
                        ]
                    });

                giveaway.messageId =
                    message.id;

                saveJSON(
                    'sorteios.json',
                    sorteios
                );

                setTimeout(
                    async () => {
                        const current =
                            sorteios[
                                giveawayId
                            ];

                        if (!current) return;

                        delete sorteios[
                            giveawayId
                        ];

                        saveJSON(
                            'sorteios.json',
                            sorteios
                        );
                    },
                    duration * 60000
                );

                return interaction.reply({
                    content:
                        '🎁 Sorteio criado!',
                    ephemeral: true
                });
            }
        }

        /* ===== PARTICIPAÇÃO EM SORTEIO ===== */

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'giveaway_join_'
            )
        ) {
            const giveawayId =
                interaction.customId.replace(
                    'giveaway_join_',
                    ''
                );

            const giveaway =
                sorteios[giveawayId];

            if (!giveaway) {
                return interaction.reply({
                    content:
                        '❌ Esse sorteio não está mais ativo.',
                    ephemeral: true
                });
            }

            if (
                giveaway.participants.includes(
                    interaction.user.id
                )
            ) {
                return interaction.reply({
                    content:
                        'Você já está participando.',
                    ephemeral: true
                });
            }

            giveaway.participants.push(
                interaction.user.id
            );

            saveJSON(
                'sorteios.json',
                sorteios
            );

            return interaction.reply({
                content:
                    '🎁 Você entrou no sorteio!',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error(
            'Erro na interação:',
            error
        );

        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({
                    content:
                        '❌ Ocorreu um erro ao executar esta ação.',
                    ephemeral: true
                });
            } catch {}
        }
    }
});

/* =========================
   ANTI-SPAM
========================= */

const spamTracker = new Map();

client.on('messageCreate', async message => {
    if (
        message.author.bot ||
        !message.guild
    ) {
        return;
    }

    const cfg =
        getConfig(message.guild.id);

    if (!cfg.antiSpam) return;

    const key =
        `${message.guild.id}-${message.author.id}`;

    const now = Date.now();

    if (!spamTracker.has(key)) {
        spamTracker.set(key, []);
    }

    const messages =
        spamTracker
            .get(key)
            .filter(
                timestamp =>
                    now - timestamp < 5000
            );

    messages.push(now);

    spamTracker.set(
        key,
        messages
    );

    if (messages.length >= 6) {
        const member =
            message.member;

        if (
            member &&
            member.moderatable
        ) {
            try {
                await member.timeout(
                    10000,
                    'Anti-Spam'
                );

                await message.channel.send(
                    `🛡️ ${member} recebeu timeout por spam.`
                );

                spamTracker.delete(key);
            } catch {}
        }
    }
});

/* =========================
   LOGIN
========================= */

client.login(TOKEN);
