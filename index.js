require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const fs = require('fs');

// ======================================================
// CONFIGURAÇÕES PRINCIPAIS
// ======================================================

const TOKEN = process.env.TOKEN;

const CLIENT_ID = '1556725113188257842';
const GUILD_ID = '1401231514812809256';

const ADM_ROLE_ID = '1454153278060367933';

// LINK DO BANNER DOS TICKETS
const TICKET_BANNER_URL = 'https://cdn.imgchest.com/files/52cd34cf74ad.png';

// ======================================================
// ARQUIVOS
// ======================================================

const CONFIG_FILE = './config.json';
const WARN_FILE = './advertencias.json';
const GIVEAWAY_FILE = './sorteios.json';
const INVITES_FILE = './convites.json';

function loadJSON(file, fallback) {

    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            JSON.stringify(fallback, null, 2)
        );

        return fallback;
    }

    try {

        return JSON.parse(
            fs.readFileSync(file, 'utf8')
        );

    } catch {

        return fallback;
    }
}

let configs = loadJSON(CONFIG_FILE, {});
let advertencias = loadJSON(WARN_FILE, {});
let sorteios = loadJSON(GIVEAWAY_FILE, {});
let convites = loadJSON(INVITES_FILE, {});

function saveJSON(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}

// ======================================================
// CLIENT
// ======================================================

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites

    ]
});

// ======================================================
// CONFIGURAÇÃO POR SERVIDOR
// ======================================================

function getConfig(guildId) {

    if (!configs[guildId]) {

        configs[guildId] = {

            ticketCanal: null,

            ticketCategoria: null,

            ticketCargo: ADM_ROLE_ID,

            protecao: {

                antiSpam: false,

                antiRaid: false

            }
        };

        saveJSON(
            CONFIG_FILE,
            configs
        );
    }

    return configs[guildId];
}

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function isStaff(member) {

    return (

        member.permissions.has(
            PermissionFlagsBits.Administrator
        ) ||

        member.permissions.has(
            PermissionFlagsBits.ManageGuild
        ) ||

        member.roles.cache.has(
            ADM_ROLE_ID
        )

    );
}

function formatTime(ms) {

    const totalSeconds =
        Math.floor(ms / 1000);

    const days =
        Math.floor(
            totalSeconds / 86400
        );

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    const parts = [];

    if (days)
        parts.push(`${days}d`);

    if (hours)
        parts.push(`${hours}h`);

    if (minutes)
        parts.push(`${minutes}m`);

    if (
        seconds ||
        parts.length === 0
    )
        parts.push(`${seconds}s`);

    return parts.join(' ');
}

function randomItem(array) {

    if (!array.length)
        return null;

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

// ======================================================
// PAINEL PRINCIPAL
// ======================================================

function mainPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '⚙️ Painel do Seraphins'
            )

            .setDescription(
                'Bem-vindo ao painel de controle do **Seraphins**.\n\n' +
                'Escolha uma categoria abaixo para acessar as funções.'
            )

            .addFields(

                {
                    name: '🛡️ Moderação',
                    value: 'Gerenciar membros e punições.',
                    inline: true
                },

                {
                    name: '🎫 Tickets',
                    value: 'Atendimento e suporte.',
                    inline: true
                },

                {
                    name: '🛡️ Proteção',
                    value: 'Anti-Spam e Anti-Raid.',
                    inline: true
                },

                {
                    name: '🎁 Sorteios',
                    value: 'Criar e gerenciar sorteios.',
                    inline: true
                },

                {
                    name: '📊 Servidor',
                    value: 'Informações do servidor.',
                    inline: true
                },

                {
                    name: '🎉 Diversão',
                    value: 'Jogos e brincadeiras.',
                    inline: true
                },

                {
                    name: '⚙️ Configurações',
                    value: 'Configurar o Seraphins.',
                    inline: true
                }

            )

            .setFooter({
                text: 'Seraphins • Painel'
            });

    const row1 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('panel_mod')
                    .setLabel('Moderação')
                    .setEmoji('🛡️')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId('panel_ticket')
                    .setLabel('Tickets')
                    .setEmoji('🎫')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId('panel_protection')
                    .setLabel('Proteção')
                    .setEmoji('🛡️')
                    .setStyle(
                        ButtonStyle.Danger
                    )

            );

    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('panel_giveaway')
                    .setLabel('Sorteios')
                    .setEmoji('🎁')
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId('panel_server')
                    .setLabel('Servidor')
                    .setEmoji('📊')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId('panel_fun')
                    .setLabel('Diversão')
                    .setEmoji('🎉')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId('panel_config')
                    .setLabel('Configurações')
                    .setEmoji('⚙️')
                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row1,
            row2
        ]

    };
}

// ======================================================
// PAINEL DE MODERAÇÃO
// ======================================================

function moderationPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🛡️ Moderação'
            )

            .setDescription(
                'Escolha uma ação.\n\n' +
                'As ações de punição abrirão um formulário para você informar o usuário e o motivo.'
            );

    const row1 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('mod_ban')
                    .setLabel('Banir')
                    .setEmoji('🔨')
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_kick')
                    .setLabel('Expulsar')
                    .setEmoji('👢')
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_timeout')
                    .setLabel('Timeout')
                    .setEmoji('⏳')
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_untimeout')
                    .setLabel('Remover Timeout')
                    .setEmoji('🔓')
                    .setStyle(
                        ButtonStyle.Success
                    )

            );

    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('mod_warn')
                    .setLabel('Advertir')
                    .setEmoji('⚠️')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_warns')
                    .setLabel('Ver Advertências')
                    .setEmoji('📋')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_delwarn')
                    .setLabel('Remover Advertência')
                    .setEmoji('🗑️')
                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );

    const row3 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId('mod_lock')
                    .setLabel('Trancar Canal')
                    .setEmoji('🔒')
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_unlock')
                    .setLabel('Destrancar Canal')
                    .setEmoji('🔓')
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId('mod_slowmode')
                    .setLabel('Slowmode')
                    .setEmoji('🐌')
                    .setStyle(
                        ButtonStyle.Primary
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row1,
            row2,
            row3
        ]

    };
}

// ======================================================
// MODAIS DE MODERAÇÃO
// ======================================================

function moderationModal(type) {

    const titles = {

        ban: '🔨 Banir usuário',

        kick: '👢 Expulsar usuário',

        timeout: '⏳ Aplicar Timeout',

        untimeout: '🔓 Remover Timeout',

        warn: '⚠️ Advertir usuário',

        warns: '📋 Ver advertências',

        delwarn: '🗑️ Remover advertência'

    };

    const modal =
        new ModalBuilder()
            .setCustomId(
                `modal_${type}`
            )
            .setTitle(
                titles[type] || 'Moderação'
            );

    const userInput =
        new TextInputBuilder()
            .setCustomId(
                'user_id'
            )
            .setLabel(
                'ID do usuário'
            )
            .setPlaceholder(
                'Ex: 123456789012345678'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                userInput
            )

    );

    if (

        type === 'ban' ||
        type === 'kick' ||
        type === 'timeout' ||
        type === 'warn'

    ) {

        const reason =
            new TextInputBuilder()
                .setCustomId(
                    'reason'
                )
                .setLabel(
                    'Motivo'
                )
                .setPlaceholder(
                    'Digite o motivo'
                )
                .setStyle(
                    TextInputStyle.Paragraph
                )
                .setRequired(false);

        modal.addComponents(

            new ActionRowBuilder()
                .addComponents(
                    reason
                )

        );
    }

    if (
        type === 'timeout'
    ) {

        const duration =
            new TextInputBuilder()
                .setCustomId(
                    'duration'
                )
                .setLabel(
                    'Duração em minutos'
                )
                .setPlaceholder(
                    'Ex: 10'
                )
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(true);

        modal.addComponents(

            new ActionRowBuilder()
                .addComponents(
                    duration
                )

        );
    }

    return modal;
}

// ======================================================
// TICKETS
// ======================================================

function ticketPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎫 Tickets'
            )

            .setDescription(
                'Configure o sistema de tickets do Seraphins.\n\n' +
                '📌 **Canal:** onde o painel será enviado\n' +
                '📂 **Categoria:** onde os tickets serão criados\n' +
                '👤 **Cargo ADM:** quem terá acesso aos tickets'
            )

            .setColor('#5865F2');

    const row1 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_set_channel'
                    )
                    .setLabel(
                        'Definir Canal'
                    )
                    .setEmoji('📌')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_set_category'
                    )
                    .setLabel(
                        'Definir Categoria'
                    )
                    .setEmoji('📂')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_set_role'
                    )
                    .setLabel(
                        'Definir Cargo ADM'
                    )
                    .setEmoji('👤')
                    .setStyle(
                        ButtonStyle.Primary
                    )

            );

    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_send_panel'
                    )
                    .setLabel(
                        'Enviar Painel de Ticket'
                    )
                    .setEmoji('🎫')
                    .setStyle(
                        ButtonStyle.Success
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row1,
            row2
        ]

    };
}

function ticketOpenPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎫 Central de Atendimento'
            )

            .setDescription(
                'Precisa de ajuda?\n\n' +
                'Clique no botão abaixo para abrir um ticket.\n\n' +
                'Nossa equipe estará disponível para ajudar você.'
            )

            .setColor('#5865F2');

    if (

        TICKET_BANNER_URL &&
        TICKET_BANNER_URL !==
            'COLE_AQUI_O_LINK_DO_BANNER'

    ) {

        embed.setImage(
            TICKET_BANNER_URL
        );
    }

    const row =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'open_ticket'
                    )
                    .setLabel(
                        'Abrir Ticket'
                    )
                    .setEmoji('🎫')
                    .setStyle(
                        ButtonStyle.Success
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row
        ]

    };
}

async function openTicket(interaction) {

    const guild =
        interaction.guild;

    const cfg =
        getConfig(
            guild.id
        );

    const existing =
        guild.channels.cache.find(

            channel =>

                channel.type ===
                    ChannelType.GuildText &&

                channel.topic ===
                    `seraphins-ticket:${interaction.user.id}`

        );

    if (existing) {

        return interaction.reply({

            content:
                `❌ Você já possui um ticket aberto: ${existing}`,

            ephemeral: true

        });
    }

    const category =
        cfg.ticketCategoria
            ? guild.channels.cache.get(
                cfg.ticketCategoria
            )
            : null;

    const role =
        guild.roles.cache.get(
            cfg.ticketCargo ||
            ADM_ROLE_ID
        );

    const channel =
        await guild.channels.create({

            name:
                `ticket-${interaction.user.username}`
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9-]/g,
                        ''
                    )
                    .slice(
                        0,
                        80
                    ),

            type:
                ChannelType.GuildText,

            parent:
                category?.type ===
                ChannelType.GuildCategory
                    ? category.id
                    : undefined,

            topic:
                `seraphins-ticket:${interaction.user.id}`,

            permissionOverwrites: [

                {

                    id:
                        guild.roles.everyone.id,

                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ]

                },

                {

                    id:
                        interaction.user.id,

                    allow: [

                        PermissionFlagsBits.ViewChannel,

                        PermissionFlagsBits.SendMessages,

                        PermissionFlagsBits.ReadMessageHistory

                    ]

                },

                {

                    id:
                        client.user.id,

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

        await channel.permissionOverwrites.create(

            role.id,

            {

                ViewChannel: true,

                SendMessages: true,

                ReadMessageHistory: true

            }

        );
    }

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎫 Ticket Aberto'
            )

            .setDescription(

                `Olá ${interaction.user}!\n\n` +

                'Explique seu problema abaixo.\n' +

                'Um membro da equipe irá atendê-lo.\n\n' +

                '👤 **Assumir Ticket**\n' +

                '📞 **Chamar ADM**\n' +

                '🔒 **Fechar Ticket**'

            )

            .setColor('#5865F2');

    if (

        TICKET_BANNER_URL &&
        TICKET_BANNER_URL !==
            'COLE_AQUI_O_LINK_DO_BANNER'

    ) {

        embed.setImage(
            TICKET_BANNER_URL
        );
    }

    const buttons =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_claim'
                    )
                    .setLabel(
                        'Assumir Ticket'
                    )
                    .setEmoji('👤')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_call_adm'
                    )
                    .setLabel(
                        'Chamar ADM'
                    )
                    .setEmoji('📞')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'ticket_close'
                    )
                    .setLabel(
                        'Fechar Ticket'
                    )
                    .setEmoji('🔒')
                    .setStyle(
                        ButtonStyle.Danger
                    )

            );

    await channel.send({

        content:
            role
                ? `${role} ${interaction.user}`
                : `${interaction.user}`,

        embeds: [
            embed
        ],

        components: [
            buttons
        ]

    });

    return interaction.reply({

        content:
            `✅ Ticket criado: ${channel}`,

        ephemeral: true

    });
}

// ======================================================
// PROTEÇÃO
// ======================================================

function protectionPanel(guildId) {

    const cfg =
        getConfig(
            guildId
        );

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🛡️ Proteção'
            )

            .setDescription(

                `💬 Anti-Spam: ${
                    cfg.protecao.antiSpam
                        ? '🟢 Ativado'
                        : '🔴 Desativado'
                }\n\n` +

                `🚨 Anti-Raid: ${
                    cfg.protecao.antiRaid
                        ? '🟢 Ativado'
                        : '🔴 Desativado'
                }`

            );

    const row =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'toggle_spam'
                    )
                    .setLabel(
                        'Anti-Spam'
                    )
                    .setEmoji('💬')
                    .setStyle(

                        cfg.protecao.antiSpam
                            ? ButtonStyle.Success
                            : ButtonStyle.Secondary

                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'toggle_raid'
                    )
                    .setLabel(
                        'Anti-Raid'
                    )
                    .setEmoji('🚨')
                    .setStyle(

                        cfg.protecao.antiRaid
                            ? ButtonStyle.Success
                            : ButtonStyle.Secondary

                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row
        ]

    };
}

// ======================================================
// SERVIDOR
// ======================================================

function serverPanel(guild) {

    const humans =
        guild.members.cache.filter(
            member =>
                !member.user.bot
        ).size;

    const bots =
        guild.members.cache.filter(
            member =>
                member.user.bot
        ).size;

    const owner =
        guild.members.cache.get(
            guild.ownerId
        );

    const created =
        `<t:${Math.floor(
            guild.createdTimestamp / 1000
        )}:D>`;

    const embed =
        new EmbedBuilder()

            .setTitle(
                `📊 ${guild.name}`
            )

            .setThumbnail(
                guild.iconURL({
                    dynamic: true
                })
            )

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
                    value:
                        owner
                            ? `${owner.user}`
                            : `<@${guild.ownerId}>`,
                    inline: true
                },

                {
                    name: '📅 Criado em',
                    value: created,
                    inline: true
                },

                {
                    name: '🆔 ID',
                    value: guild.id,
                    inline: true
                }

            );

    return {

        embeds: [
            embed
        ]

    };
}

// ======================================================
// DIVERSÃO
// ======================================================

function funPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎉 Diversão'
            )

            .setDescription(
                'Escolha uma brincadeira para usar no servidor.'
            );

    const row1 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'fun_dice'
                    )
                    .setLabel(
                        'Dado'
                    )
                    .setEmoji('🎲')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_coin'
                    )
                    .setLabel(
                        'Cara ou Coroa'
                    )
                    .setEmoji('🪙')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_8ball'
                    )
                    .setLabel(
                        'Bola 8'
                    )
                    .setEmoji('🎱')
                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );

    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'fun_number'
                    )
                    .setLabel(
                        'Adivinhar Número'
                    )
                    .setEmoji('🔢')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_choose'
                    )
                    .setLabel(
                        'Escolher Pessoa'
                    )
                    .setEmoji('🃏')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_quiz'
                    )
                    .setLabel(
                        'Quiz'
                    )
                    .setEmoji('🏆')
                    .setStyle(
                        ButtonStyle.Success
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row1,
            row2
        ]

    };
}

// ======================================================
// CONFIGURAÇÕES
// ======================================================

function configPanel(guildId) {

    const cfg =
        getConfig(
            guildId
        );

    const embed =
        new EmbedBuilder()

            .setTitle(
                '⚙️ Configurações'
            )

            .setDescription(

                `🎫 **Canal de Tickets:** ${
                    cfg.ticketCanal
                        ? `<#${cfg.ticketCanal}>`
                        : 'Não configurado'
                }\n\n` +

                `📂 **Categoria:** ${
                    cfg.ticketCategoria
                        ? `<#${cfg.ticketCategoria}>`
                        : 'Não configurada'
                }\n\n` +

                `👤 **Cargo ADM:** ${
                    cfg.ticketCargo
                        ? `<@&${cfg.ticketCargo}>`
                        : 'Não configurado'
                }\n\n` +

                `💬 **Anti-Spam:** ${
                    cfg.protecao.antiSpam
                        ? '🟢'
                        : '🔴'
                }\n\n` +

                `🚨 **Anti-Raid:** ${
                    cfg.protecao.antiRaid
                        ? '🟢'
                        : '🔴'
                }`

            );

    const row =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'config_tickets'
                    )
                    .setLabel(
                        'Tickets'
                    )
                    .setEmoji('🎫')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'config_protection'
                    )
                    .setLabel(
                        'Proteção'
                    )
                    .setEmoji('🛡️')
                    .setStyle(
                        ButtonStyle.Danger
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row
        ]

    };
}

// ======================================================
// SORTEIOS
// ======================================================

function giveawayPanel() {

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎁 Sorteios'
            )

            .setDescription(

                'Crie e gerencie sorteios do servidor.\n\n' +

                'Os participantes podem precisar atingir uma quantidade mínima de convites.'

            );

    const row =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        'giveaway_create'
                    )
                    .setLabel(
                        'Criar Sorteio'
                    )
                    .setEmoji('🎁')
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'giveaway_active'
                    )
                    .setLabel(
                        'Sorteios Ativos'
                    )
                    .setEmoji('📋')
                    .setStyle(
                        ButtonStyle.Primary
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row
        ]

    };
}

function giveawayCreateModal() {

    const modal =
        new ModalBuilder()
            .setCustomId(
                'giveaway_modal'
            )
            .setTitle(
                '🎁 Criar Sorteio'
            );

    const prize =
        new TextInputBuilder()
            .setCustomId(
                'prize'
            )
            .setLabel(
                'Prêmio'
            )
            .setPlaceholder(
                'Ex: Nitro, Robux, cargo especial...'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true);

    const duration =
        new TextInputBuilder()
            .setCustomId(
                'duration'
            )
            .setLabel(
                'Duração em minutos'
            )
            .setPlaceholder(
                'Ex: 60'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true);

    const winners =
        new TextInputBuilder()
            .setCustomId(
                'winners'
            )
            .setLabel(
                'Quantidade de vencedores'
            )
            .setPlaceholder(
                'Ex: 1'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true);

    const invites =
        new TextInputBuilder()
            .setCustomId(
                'invites'
            )
            .setLabel(
                'Convites necessários'
            )
            .setPlaceholder(
                'Ex: 5'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(prize),

        new ActionRowBuilder()
            .addComponents(duration),

        new ActionRowBuilder()
            .addComponents(winners),

        new ActionRowBuilder()
            .addComponents(invites)

    );

    return modal;
}

function giveawayMessage(giveaway) {

    const remaining =
        giveaway.endAt -
        Date.now();

    const embed =
        new EmbedBuilder()

            .setTitle(
                '🎁 SORTEIO'
            )

            .setDescription(

                `🏆 **Prêmio:** ${giveaway.prize}\n\n` +

                `👥 **Vencedores:** ${giveaway.winners}\n` +

                `📨 **Convites necessários:** ${giveaway.requiredInvites}\n\n` +

                `👤 **Participantes:** ${giveaway.participants.length}\n\n` +

                `⏰ **Termina:** ${
                    remaining > 0
                        ? `<t:${Math.floor(
                            giveaway.endAt / 1000
                        )}:R>`
                        : 'Finalizado'
                }`

            )

            .setFooter({

                text:
                    `Sorteio criado por ${giveaway.creatorTag}`

            });

    const row =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `giveaway_join:${giveaway.id}`
                    )
                    .setLabel(
                        'Participar'
                    )
                    .setEmoji('🎉')
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `giveaway_count:${giveaway.id}`
                    )
                    .setLabel(
                        'Participantes'
                    )
                    .setEmoji('👥')
                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );

    return {

        embeds: [
            embed
        ],

        components: [
            row
        ]

    };
}

// ======================================================
// SISTEMA DE CONVITES
// ======================================================

const inviteCache =
    new Map();

async function loadInvites(guild) {

    try {

        const invites =
            await guild.invites.fetch();

        const data =
            new Map();

        invites.forEach(
            invite => {

                data.set(

                    invite.code,

                    {

                        uses:
                            invite.uses || 0,

                        inviterId:
                            invite.inviter?.id ||
                            null

                    }

                );

            }
        );

        inviteCache.set(
            guild.id,
            data
        );

    } catch {

        console.log(
            `Não foi possível carregar convites de ${guild.name}`
        );
    }
}

async function updateInviteCache(guild) {

    try {

        const invites =
            await guild.invites.fetch();

        const data =
            new Map();

        invites.forEach(
            invite => {

                data.set(

                    invite.code,

                    {

                        uses:
                            invite.uses || 0,

                        inviterId:
                            invite.inviter?.id ||
                            null

                    }

                );

            }
        );

        inviteCache.set(
            guild.id,
            data
        );

    } catch {}
}

async function detectInvite(guild) {

    try {

        const oldData =
            inviteCache.get(
                guild.id
            ) ||
            new Map();

        const newInvites =
            await guild.invites.fetch();

        let usedInvite =
            null;

        newInvites.forEach(
            invite => {

                const old =
                    oldData.get(
                        invite.code
                    );

                const oldUses =
                    old?.uses || 0;

                const newUses =
                    invite.uses || 0;

                if (
                    newUses >
                    oldUses
                ) {

                    usedInvite =
                        invite;

                }

            }
        );

        const newData =
            new Map();

        newInvites.forEach(
            invite => {

                newData.set(

                    invite.code,

                    {

                        uses:
                            invite.uses || 0,

                        inviterId:
                            invite.inviter?.id ||
                            null

                    }

                );

            }
        );

        inviteCache.set(
            guild.id,
            newData
        );

        return usedInvite;

    } catch {

        return null;
    }
}

// ======================================================
// ENTRADA DE MEMBRO
// ======================================================

client.on(
    'guildMemberAdd',
    async member => {

        const invite =
            await detectInvite(
                member.guild
            );

        if (
            !invite ||
            !invite.inviter
        )
            return;

        const inviterId =
            invite.inviter.id;

        if (
            !convites[
                member.guild.id
            ]
        ) {

            convites[
                member.guild.id
            ] = {};

        }

        if (
            !convites[
                member.guild.id
            ][inviterId]
        ) {

            convites[
                member.guild.id
            ][inviterId] = {

                total: 0,

                members: []

            };
        }

        const dados =
            convites[
                member.guild.id
            ][inviterId];

        if (
            !dados.members.includes(
                member.id
            )
        ) {

            dados.members.push(
                member.id
            );

            dados.total++;

        }

        saveJSON(
            INVITES_FILE,
            convites
        );

    }
);

// ======================================================
// SAÍDA DE MEMBRO
// ======================================================

client.on(
    'guildMemberRemove',
    member => {

        const guildData =
            convites[
                member.guild.id
            ];

        if (!guildData)
            return;

        for (
            const inviterId of
            Object.keys(guildData)
        ) {

            const data =
                guildData[
                    inviterId
                ];

            const index =
                data.members.indexOf(
                    member.id
                );

            if (
                index !== -1
            ) {

                data.members.splice(
                    index,
                    1
                );

                if (
                    data.total > 0
                ) {

                    data.total--;

                }

                break;
            }
        }

        saveJSON(
            INVITES_FILE,
            convites
        );

    }
);

// ======================================================
// CRIAÇÃO DE SORTEIO
// ======================================================

async function createGiveaway(interaction) {

    const prize =
        interaction.fields
            .getTextInputValue(
                'prize'
            );

    const duration =
        parseInt(
            interaction.fields
                .getTextInputValue(
                    'duration'
                )
        );

    const winners =
        parseInt(
            interaction.fields
                .getTextInputValue(
                    'winners'
                )
        );

    const requiredInvites =
        parseInt(
            interaction.fields
                .getTextInputValue(
                    'invites'
                )
        );

    if (

        !Number.isInteger(
            duration
        ) ||

        duration <= 0 ||

        !Number.isInteger(
            winners
        ) ||

        winners <= 0 ||

        !Number.isInteger(
            requiredInvites
        ) ||

        requiredInvites < 0

    ) {

        return interaction.reply({

            content:
                '❌ Verifique os valores informados.',

            ephemeral: true

        });
    }

    const id =
        `${interaction.guild.id}-${Date.now()}`;

    const giveaway = {

        id,

        guildId:
            interaction.guild.id,

        channelId:
            interaction.channel.id,

        creatorId:
            interaction.user.id,

        creatorTag:
            interaction.user.tag,

        prize,

        winners,

        requiredInvites,

        participants: [],

        endAt:
            Date.now() +
            duration * 60 * 1000,

        finalizado:
            false,

        winnerIds: []

    };

    sorteios[id] =
        giveaway;

    saveJSON(
        GIVEAWAY_FILE,
        sorteios
    );

    const message =
        await interaction.channel.send(
            giveawayMessage(
                giveaway
            )
        );

    giveaway.messageId =
        message.id;

    saveJSON(
        GIVEAWAY_FILE,
        sorteios
    );

    await interaction.reply({

        content:

            `✅ Sorteio criado com sucesso!\n` +

            `🎁 Prêmio: **${prize}**\n` +

            `⏰ Duração: **${duration} minutos**\n` +

            `📨 Convites necessários: **${requiredInvites}**`,

        ephemeral: true

    });

    setTimeout(

        () =>
            finishGiveaway(id),

        duration * 60 * 1000

    );
}

// ======================================================
// PARTICIPAR DE SORTEIO
// ======================================================

async function joinGiveaway(
    interaction,
    giveaway
) {

    if (
        giveaway.finalizado
    ) {

        return interaction.reply({

            content:
                '❌ Esse sorteio já terminou.',

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
                '⚠️ Você já está participando desse sorteio.',

            ephemeral: true

        });
    }

    giveaway.participants.push(
        interaction.user.id
    );

    saveJSON(
        GIVEAWAY_FILE,
        sorteios
    );

    return interaction.reply({

        content:

            '🎉 Você entrou no sorteio!\n' +

            `📨 Requisito: **${giveaway.requiredInvites} convites**.`,

        ephemeral: true

    });
}

// ======================================================
// CONTAGEM DE CONVITES
// ======================================================

function getUserInvites(
    guildId,
    userId
) {

    return (

        convites[
            guildId
        ]?.[
            userId
        ]?.total ||

        0

    );
}

// ======================================================
// FINALIZAR SORTEIO
// ======================================================

async function finishGiveaway(id) {

    const giveaway =
        sorteios[id];

    if (
        !giveaway ||
        giveaway.finalizado
    )
        return;

    giveaway.finalizado =
        true;

    saveJSON(
        GIVEAWAY_FILE,
        sorteios
    );

    const guild =
        client.guilds.cache.get(
            giveaway.guildId
        );

    if (!guild)
        return;

    const channel =
        guild.channels.cache.get(
            giveaway.channelId
        );

    if (!channel)
        return;

    const participantes =
        [
            ...giveaway.participants
        ];

    const vencedores = [];

    const candidatos =
        [
            ...participantes
        ];

    while (

        vencedores.length <
            giveaway.winners &&

        candidatos.length > 0

    ) {

        const index =
            Math.floor(
                Math.random() *
                candidatos.length
            );

        const userId =
            candidatos.splice(
                index,
                1
            )[0];

        const inviteCount =
            getUserInvites(
                guild.id,
                userId
            );

        if (

            inviteCount >=
            giveaway.requiredInvites

        ) {

            vencedores.push(
                userId
            );

        } else {

            await channel.send(

                `❌ <@${userId}> não atingiu os requisitos!\n` +

                `📨 Necessário: **${giveaway.requiredInvites} convites**\n` +

                `📨 Possui: **${inviteCount} convites**\n` +

                `🔄 **Roleta girada novamente!**`

            );
        }
    }

    giveaway.winnerIds =
        vencedores;

    saveJSON(
        GIVEAWAY_FILE,
        sorteios
    );

    if (
        !vencedores.length
    ) {

        return channel.send(

            `❌ O sorteio de **${giveaway.prize}** terminou sem vencedor.\n` +

            `Nenhum participante atingiu os requisitos.`

        );
    }

    const mentions =
        vencedores
            .map(
                id =>
                    `<@${id}>`
            )
            .join(', ');

    return channel.send(

        `🎉 **SORTEIO FINALIZADO!**\n\n` +

        `🎁 Prêmio: **${giveaway.prize}**\n` +

        `🏆 Vencedor(es): ${mentions}\n\n` +

        `Parabéns! 🎉`

    );
}

// ======================================================
// READY
// ======================================================

client.once(
    'clientReady',
    async () => {

        console.log(
            `🤖 ${client.user.tag} está online!`
        );

        client.user.setActivity(
            'Painel do servidor',
            {
                type: 3
            }
        );

        for (
            const guild of
            client.guilds.cache.values()
        ) {

            await loadInvites(
                guild
            );

        }

        console.log(
            '📨 Sistema de convites carregado.'
        );

    }
);

// ======================================================
// COMANDOS SLASH
// ======================================================

const commands = [

    new SlashCommandBuilder()

        .setName(
            'ping'
        )

        .setDescription(
            'Verifica se o Seraphins está online'
        ),

    new SlashCommandBuilder()

        .setName(
            'painel'
        )

        .setDescription(
            'Abre o painel do Seraphins'
        ),

    new SlashCommandBuilder()

        .setName(
            'setupticket'
        )

        .setDescription(
            'Configura o painel de tickets'
        )

        .addChannelOption(
            option =>

                option

                    .setName(
                        'canal'
                    )

                    .setDescription(
                        'Canal onde o painel será enviado'
                    )

                    .addChannelTypes(
                        ChannelType.GuildText
                    )

                    .setRequired(true)

        ),

    new SlashCommandBuilder()

        .setName(
            'convites'
        )

        .setDescription(
            'Mostra a quantidade de convites de um usuário'
        )

        .addUserOption(
            option =>

                option

                    .setName(
                        'usuario'
                    )

                    .setDescription(
                        'Usuário que deseja consultar'
                    )

                    .setRequired(false)

        )

];

const rest =
    new REST({
        version: '10'
    }).setToken(
        TOKEN
    );

(async () => {

    try {

        await rest.put(

            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),

            {

                body:
                    commands.map(
                        command =>
                            command.toJSON()
                    )

            }

        );

        console.log(
            '✅ Comandos registrados!'
        );

    } catch (error) {

        console.error(
            error
        );
    }

})();

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
    'interactionCreate',
    async interaction => {

        try {

            // ==========================================
            // SLASH COMMANDS
            // ==========================================

            if (
                interaction.isChatInputCommand()
            ) {

                if (
                    interaction.commandName ===
                    'ping'
                ) {

                    return interaction.reply(
                        '🏓 Pong! O Seraphins está online!'
                    );
                }

                if (
                    interaction.commandName ===
                    'painel'
                ) {

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                '❌ Você não tem permissão para abrir o painel.',

                            ephemeral: true

                        });
                    }

                    return interaction.reply(
                        mainPanel()
                    );
                }

                // ======================================
                // SETUP TICKET
                // ======================================

                if (
                    interaction.commandName ===
                    'setupticket'
                ) {

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                '❌ Você não tem permissão.',

                            ephemeral: true

                        });
                    }

                    const canal =
                        interaction.options.getChannel(
                            'canal'
                        );

                    const permissions =
                        canal.permissionsFor(
                            client.user
                        );

                    if (
                        !permissions ||
                        !permissions.has(
                            PermissionFlagsBits.ViewChannel
                        ) ||
                        !permissions.has(
                            PermissionFlagsBits.SendMessages
                        ) ||
                        !permissions.has(
                            PermissionFlagsBits.EmbedLinks
                        )
                    ) {

                        return interaction.reply({

                            content:

                                '❌ Eu não consigo enviar o painel nesse canal.\n\n' +

                                'Verifique se meu cargo possui:\n' +

                                '👁️ Ver Canal\n' +

                                '💬 Enviar Mensagens\n' +

                                '🔗 Incorporar Links',

                            ephemeral: true

                        });
                    }

                    const cfg =
                        getConfig(
                            interaction.guild.id
                        );

                    cfg.ticketCanal =
                        canal.id;

                    saveJSON(
                        CONFIG_FILE,
                        configs
                    );

                    try {

                        await canal.send(
                            ticketOpenPanel()
                        );

                    } catch (error) {

                        console.error(
                            '❌ Erro ao enviar painel de ticket:',
                            error
                        );

                        return interaction.reply({

                            content:

                                '❌ Não consegui enviar o painel nesse canal.\n' +

                                'Verifique as permissões específicas desse canal.',

                            ephemeral: true

                        });
                    }

                    return interaction.reply({

                        content:
                            `✅ Painel enviado em ${canal}.`,

                        ephemeral: true

                    });
                }

                // ======================================
                // CONVITES
                // ======================================

                if (
                    interaction.commandName ===
                    'convites'
                ) {

                    const user =
                        interaction.options.getUser(
                            'usuario'
                        ) ||
                        interaction.user;

                    const quantidade =
                        getUserInvites(
                            interaction.guild.id,
                            user.id
                        );

                    return interaction.reply(

                        `📨 ${user} possui **${quantidade} convite(s)** válidos.`

                    );
                }
            }

            // ==========================================
            // ABRIR TICKET
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'open_ticket'

            ) {

                return openTicket(
                    interaction
                );
            }

            // ==========================================
            // PAINÉIS
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_mod'

            ) {

                return interaction.update(
                    moderationPanel()
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_ticket'

            ) {

                return interaction.update(
                    ticketPanel()
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_protection'

            ) {

                return interaction.update(

                    protectionPanel(
                        interaction.guild.id
                    )

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_giveaway'

            ) {

                return interaction.update(
                    giveawayPanel()
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_server'

            ) {

                return interaction.update(

                    serverPanel(
                        interaction.guild
                    )

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_fun'

            ) {

                return interaction.update(
                    funPanel()
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'panel_config'

            ) {

                return interaction.update(

                    configPanel(
                        interaction.guild.id
                    )

                );
            }

            // ==========================================
            // MODERAÇÃO → MODAIS
            // ==========================================

            const moderationButtons = [

                'mod_ban',

                'mod_kick',

                'mod_timeout',

                'mod_untimeout',

                'mod_warn',

                'mod_warns',

                'mod_delwarn'

            ];

            if (

                interaction.isButton() &&

                moderationButtons.includes(
                    interaction.customId
                )

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                const type =
                    interaction.customId.replace(
                        'mod_',
                        ''
                    );

                return interaction.showModal(
                    moderationModal(type)
                );
            }

            // ==========================================
            // TRANCAR CANAL
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'mod_lock'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                await interaction.channel
                    .permissionOverwrites.edit(

                        interaction.guild
                            .roles
                            .everyone
                            .id,

                        {
                            SendMessages: false
                        }

                    );

                return interaction.reply(
                    '🔒 Este canal foi trancado.'
                );
            }

            // ==========================================
            // DESTRANCAR CANAL
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'mod_unlock'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                await interaction.channel
                    .permissionOverwrites.edit(

                        interaction.guild
                            .roles
                            .everyone
                            .id,

                        {
                            SendMessages: null
                        }

                    );

                return interaction.reply(
                    '🔓 Este canal foi destrancado.'
                );
            }

            // ==========================================
            // SLOWMODE
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'mod_slowmode'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                const modal =
                    new ModalBuilder()
                        .setCustomId(
                            'modal_slowmode'
                        )
                        .setTitle(
                            '🐌 Configurar Slowmode'
                        );

                const seconds =
                    new TextInputBuilder()
                        .setCustomId(
                            'seconds'
                        )
                        .setLabel(
                            'Segundos'
                        )
                        .setPlaceholder(
                            '0 = desativar'
                        )
                        .setStyle(
                            TextInputStyle.Short
                        )
                        .setRequired(true);

                modal.addComponents(

                    new ActionRowBuilder()
                        .addComponents(
                            seconds
                        )

                );

                return interaction.showModal(
                    modal
                );
            }

            // ==========================================
            // TICKET CONFIGURAÇÃO
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_set_channel'

            ) {

                const cfg =
                    getConfig(
                        interaction.guild.id
                    );

                return interaction.reply({

                    content:

                        `📌 Canal atual: ${
                            cfg.ticketCanal
                                ? `<#${cfg.ticketCanal}>`
                                : 'não configurado'
                        }\n\n` +

                        'Use **/setupticket #canal** para definir.',

                    ephemeral: true

                });
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_set_category'

            ) {

                const modal =
                    new ModalBuilder()

                        .setCustomId(
                            'modal_ticket_category'
                        )

                        .setTitle(
                            '📂 Categoria dos Tickets'
                        );

                const input =
                    new TextInputBuilder()

                        .setCustomId(
                            'category_id'
                        )

                        .setLabel(
                            'ID da categoria'
                        )

                        .setPlaceholder(
                            'Cole o ID da categoria'
                        )

                        .setStyle(
                            TextInputStyle.Short
                        )

                        .setRequired(true);

                modal.addComponents(

                    new ActionRowBuilder()
                        .addComponents(
                            input
                        )

                );

                return interaction.showModal(
                    modal
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_set_role'

            ) {

                const modal =
                    new ModalBuilder()

                        .setCustomId(
                            'modal_ticket_role'
                        )

                        .setTitle(
                            '👤 Cargo ADM'
                        );

                const input =
                    new TextInputBuilder()

                        .setCustomId(
                            'role_id'
                        )

                        .setLabel(
                            'ID do cargo'
                        )

                        .setPlaceholder(
                            'Cole o ID do cargo ADM'
                        )

                        .setStyle(
                            TextInputStyle.Short
                        )

                        .setRequired(true);

                modal.addComponents(

                    new ActionRowBuilder()
                        .addComponents(
                            input
                        )

                );

                return interaction.showModal(
                    modal
                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_send_panel'

            ) {

                const cfg =
                    getConfig(
                        interaction.guild.id
                    );

                if (
                    !cfg.ticketCanal
                ) {

                    return interaction.reply({

                        content:
                            '❌ Primeiro configure o canal de tickets.',

                        ephemeral: true

                    });
                }

                const channel =
                    interaction.guild
                        .channels
                        .cache
                        .get(
                            cfg.ticketCanal
                        );

                if (!channel) {

                    return interaction.reply({

                        content:
                            '❌ O canal configurado não existe mais.',

                        ephemeral: true

                    });
                }

                const permissions =
                    channel.permissionsFor(
                        client.user
                    );

                if (

                    !permissions ||

                    !permissions.has(
                        PermissionFlagsBits.ViewChannel
                    ) ||

                    !permissions.has(
                        PermissionFlagsBits.SendMessages
                    ) ||

                    !permissions.has(
                        PermissionFlagsBits.EmbedLinks
                    )

                ) {

                    return interaction.reply({

                        content:

                            '❌ Eu não tenho permissão para enviar o painel nesse canal.\n\n' +

                            'Preciso de:\n' +

                            '👁️ Ver Canal\n' +

                            '💬 Enviar Mensagens\n' +

                            '🔗 Incorporar Links',

                        ephemeral: true

                    });
                }

                await channel.send(
                    ticketOpenPanel()
                );

                return interaction.reply({

                    content:
                        '✅ Painel de tickets enviado.',

                    ephemeral: true

                });
            }

            // ==========================================
            // PROTEÇÃO
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'toggle_spam'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                const cfg =
                    getConfig(
                        interaction.guild.id
                    );

                cfg.protecao.antiSpam =
                    !cfg.protecao.antiSpam;

                saveJSON(
                    CONFIG_FILE,
                    configs
                );

                return interaction.update(

                    protectionPanel(
                        interaction.guild.id
                    )

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'toggle_raid'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão.',

                        ephemeral: true

                    });
                }

                const cfg =
                    getConfig(
                        interaction.guild.id
                    );

                cfg.protecao.antiRaid =
                    !cfg.protecao.antiRaid;

                saveJSON(
                    CONFIG_FILE,
                    configs
                );

                return interaction.update(

                    protectionPanel(
                        interaction.guild.id
                    )

                );
            }

            // ==========================================
            // TICKET — ASSUMIR
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_claim'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Apenas a equipe pode assumir tickets.',

                        ephemeral: true

                    });
                }

                await interaction.deferReply();

                await interaction.channel
                    .permissionOverwrites
                    .create(

                        interaction.user.id,

                        {

                            ViewChannel: true,

                            SendMessages: true,

                            ReadMessageHistory: true

                        }

                    );

                return interaction.editReply(

                    `👤 ${interaction.user} assumiu este ticket.`

                );
            }

            // ==========================================
            // TICKET — CHAMAR ADM
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_call_adm'

            ) {

                const cfg =
                    getConfig(
                        interaction.guild.id
                    );

                const role =
                    interaction.guild
                        .roles
                        .cache
                        .get(

                            cfg.ticketCargo ||
                            ADM_ROLE_ID

                        );

                if (!role) {

                    return interaction.reply({

                        content:
                            '❌ Cargo ADM não encontrado.',

                        ephemeral: true

                    });
                }

                const members =
                    role.members
                        .map(
                            member => ({

                                label:
                                    member.user.username
                                        .slice(
                                            0,
                                            100
                                        ),

                                value:
                                    member.id

                            })
                        )
                        .slice(
                            0,
                            25
                        );

                if (
                    !members.length
                ) {

                    return interaction.reply({

                        content:
                            '❌ Não encontrei membros com esse cargo.',

                        ephemeral: true

                    });
                }

                const menu =
                    new StringSelectMenuBuilder()

                        .setCustomId(
                            'select_ticket_adm'
                        )

                        .setPlaceholder(
                            'Escolha um ADM'
                        )

                        .addOptions(
                            members
                        );

                return interaction.reply({

                    content:
                        '📞 Escolha o ADM:',

                    components: [

                        new ActionRowBuilder()
                            .addComponents(
                                menu
                            )

                    ],

                    ephemeral: true

                });
            }

            // ==========================================
            // TICKET — FECHAR
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'ticket_close'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Apenas a equipe pode fechar o ticket.',

                        ephemeral: true

                    });
                }

                await interaction.reply(
                    '🔒 Ticket será fechado em **5 segundos**...'
                );

                setTimeout(

                    () => {

                        interaction.channel
                            .delete()
                            .catch(
                                () => {}
                            );

                    },

                    5000

                );

                return;
            }

            // ==========================================
            // SORTEIO — CRIAR
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'giveaway_create'

            ) {

                if (
                    !isStaff(
                        interaction.member
                    )
                ) {

                    return interaction.reply({

                        content:
                            '❌ Você não tem permissão para criar sorteios.',

                        ephemeral: true

                    });
                }

                return interaction.showModal(
                    giveawayCreateModal()
                );
            }

            // ==========================================
            // SORTEIO — ATIVOS
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'giveaway_active'

            ) {

                const active =
                    Object.values(
                        sorteios
                    )
                    .filter(

                        giveaway =>

                            giveaway.guildId ===
                            interaction.guild.id &&

                            !giveaway.finalizado

                    );

                if (
                    !active.length
                ) {

                    return interaction.reply({

                        content:
                            '📋 Não existem sorteios ativos.',

                        ephemeral: true

                    });
                }

                const text =
                    active
                        .map(

                            giveaway =>

                                `🎁 **${giveaway.prize}** — <#${giveaway.channelId}>`

                        )
                        .join('\n');

                return interaction.reply({

                    content:
                        `📋 **Sorteios ativos:**\n\n${text}`,

                    ephemeral: true

                });
            }

            // ==========================================
            // SORTEIO — PARTICIPAR
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId.startsWith(
                    'giveaway_join:'
                )

            ) {

                const id =
                    interaction.customId
                        .split(':')[1];

                const giveaway =
                    sorteios[id];

                if (!giveaway) {

                    return interaction.reply({

                        content:
                            '❌ Sorteio não encontrado.',

                        ephemeral: true

                    });
                }

                return joinGiveaway(
                    interaction,
                    giveaway
                );
            }

            // ==========================================
            // SORTEIO — CONTAGEM
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId.startsWith(
                    'giveaway_count:'
                )

            ) {

                const id =
                    interaction.customId
                        .split(':')[1];

                const giveaway =
                    sorteios[id];

                if (!giveaway) {

                    return interaction.reply({

                        content:
                            '❌ Sorteio não encontrado.',

                        ephemeral: true

                    });
                }

                return interaction.reply({

                    content:

                        `👥 Existem **${giveaway.participants.length}** participante(s).`,

                    ephemeral: true

                });
            }

            // ==========================================
            // DIVERSÃO
            // ==========================================

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_dice'

            ) {

                const number =
                    Math.floor(
                        Math.random() * 6
                    ) + 1;

                return interaction.reply(

                    `🎲 ${interaction.user} tirou **${number}**!`

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_coin'

            ) {

                const result =
                    Math.random() < 0.5
                        ? 'Cara'
                        : 'Coroa';

                return interaction.reply(

                    `🪙 Deu **${result}**!`

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_8ball'

            ) {

                const answers = [

                    'Sim, com certeza.',

                    'Provavelmente.',

                    'Não conte com isso.',

                    'Talvez.',

                    'Definitivamente não.',

                    'As chances são altas.',

                    'As chances são baixas.',

                    'Não posso prever isso.'

                ];

                return interaction.reply(

                    `🎱 **Bola 8:** ${randomItem(
                        answers
                    )}`

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_number'

            ) {

                const number =
                    Math.floor(
                        Math.random() * 100
                    ) + 1;

                return interaction.reply(

                    `🔢 Pensei em um número de **1 a 100**.\n\n` +

                    `O número escolhido foi **${number}**!`

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_choose'

            ) {

                const members =
                    interaction.guild
                        .members
                        .cache
                        .filter(

                            member =>
                                !member.user.bot

                        )
                        .map(
                            member => member
                        );

                if (
                    !members.length
                ) {

                    return interaction.reply({

                        content:
                            '❌ Nenhum membro encontrado.',

                        ephemeral: true

                    });
                }

                const selected =
                    randomItem(
                        members
                    );

                return interaction.reply(

                    `🃏 A pessoa escolhida foi ${selected}!`

                );
            }

            if (

                interaction.isButton() &&

                interaction.customId ===
                    'fun_quiz'

            ) {

                const questions = [

                    {

                        q:
                            'Qual é a capital do Brasil?',

                        a:
                            'Brasília'

                    },

                    {

                        q:
                            'Qual planeta é conhecido como planeta vermelho?',

                        a:
                            'Marte'

                    },

                    {

                        q:
                            'Quantos lados possui um hexágono?',

                        a:
                            '6'

                    },

                    {

                        q:
                            'Qual é o maior oceano do planeta?',

                        a:
                            'Oceano Pacífico'

                    }

                ];

                const quiz =
                    randomItem(
                        questions
                    );

                return interaction.reply(

                    `🏆 **QUIZ**\n\n` +

                    `❓ ${quiz.q}\n\n` +

                    `💡 Resposta: **${quiz.a}**`

                );
            }

            // ==========================================
            // SELECT — ADM
            // ==========================================

            if (

                interaction.isStringSelectMenu() &&

                interaction.customId ===
                    'select_ticket_adm'

            ) {

                const id =
                    interaction.values[0];

                const member =
                    interaction.guild
                        .members
                        .cache
                        .get(id);

                if (!member) {

                    return interaction.update({

                        content:
                            '❌ Membro não encontrado.',

                        components: []

                    });
                }

                await interaction.channel
                    .permissionOverwrites
                    .create(

                        member.id,

                        {

                            ViewChannel: true,

                            SendMessages: true,

                            ReadMessageHistory: true

                        }

                    );

                await interaction.channel.send(

                    `📞 ${member} foi chamado para este ticket!`

                );

                return interaction.update({

                    content:
                        `✅ ${member} recebeu acesso ao ticket.`,

                    components: []

                });
            }

            // ==========================================
            // MODAIS
            // ==========================================

            if (
                interaction.isModalSubmit()
            ) {

                // ======================================
                // MODERAÇÃO
                // ======================================

                if (

                    interaction.customId.startsWith(
                        'modal_'
                    )

                ) {

                    const type =
                        interaction.customId.replace(
                            'modal_',
                            ''
                        );

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                '❌ Você não tem permissão.',

                            ephemeral: true

                        });
                    }

                    // ==================================
                    // SLOWMODE
                    // ==================================

                    if (
                        type ===
                        'slowmode'
                    ) {

                        const seconds =
                            parseInt(

                                interaction.fields
                                    .getTextInputValue(
                                        'seconds'
                                    )

                            );

                        if (

                            isNaN(
                                seconds
                            ) ||

                            seconds < 0 ||

                            seconds > 21600

                        ) {

                            return interaction.reply({

                                content:
                                    '❌ Use um valor entre 0 e 21600 segundos.',

                                ephemeral: true

                            });
                        }

                        await interaction.channel
                            .setRateLimitPerUser(
                                seconds
                            );

                        return interaction.reply(

                            seconds === 0

                                ? '🐌 Slowmode desativado.'

                                : `🐌 Slowmode definido para **${seconds} segundos**.`

                        );
                    }

                    // ==================================
                    // TICKET CATEGORY
                    // ==================================

                    if (
                        type ===
                        'ticket_category'
                    ) {

                        const id =
                            interaction.fields
                                .getTextInputValue(
                                    'category_id'
                                );

                        const channel =
                            interaction.guild
                                .channels
                                .cache
                                .get(id);

                        if (

                            !channel ||

                            channel.type !==
                                ChannelType.GuildCategory

                        ) {

                            return interaction.reply({

                                content:
                                    '❌ Essa categoria não foi encontrada.',

                                ephemeral: true

                            });
                        }

                        const cfg =
                            getConfig(
                                interaction.guild.id
                            );

                        cfg.ticketCategoria =
                            id;

                        saveJSON(
                            CONFIG_FILE,
                            configs
                        );

                        return interaction.reply({

                            content:

                                `✅ Categoria dos tickets definida como **${channel.name}**.`,

                            ephemeral: true

                        });
                    }

                    // ==================================
                    // TICKET ROLE
                    // ==================================

                    if (
                        type ===
                        'ticket_role'
                    ) {

                        const id =
                            interaction.fields
                                .getTextInputValue(
                                    'role_id'
                                );

                        const role =
                            interaction.guild
                                .roles
                                .cache
                                .get(id);

                        if (!role) {

                            return interaction.reply({

                                content:
                                    '❌ Cargo não encontrado.',

                                ephemeral: true

                            });
                        }

                        const cfg =
                            getConfig(
                                interaction.guild.id
                            );

                        cfg.ticketCargo =
                            id;

                        saveJSON(
                            CONFIG_FILE,
                            configs
                        );

                        return interaction.reply({

                            content:
                                `✅ Cargo ADM definido como ${role}.`,

                            ephemeral: true

                        });
                    }

                    const userId =
                        interaction.fields
                            .getTextInputValue(
                                'user_id'
                            );

                    const member =
                        await interaction.guild
                            .members
                            .fetch(
                                userId
                            )
                            .catch(
                                () => null
                            );

                    const reason =
                        interaction.fields.fields.has(
                            'reason'
                        )

                            ? interaction.fields
                                .getTextInputValue(
                                    'reason'
                                ) ||
                                'Nenhum motivo informado'

                            : 'Nenhum motivo informado';

                    // ==================================
                    // BAN
                    // ==================================

                    if (
                        type === 'ban'
                    ) {

                        if (!member) {

                            return interaction.reply({

                                content:
                                    '❌ Usuário não encontrado no servidor.',

                                ephemeral: true

                            });
                        }

                        if (
                            !member.bannable
                        ) {

                            return interaction.reply({

                                content:
                                    '❌ Não posso banir esse usuário.',

                                ephemeral: true

                            });
                        }

                        await member.ban({

                            reason

                        });

                        return interaction.reply(

                            `🔨 ${member.user.tag} foi banido.\n📝 Motivo: ${reason}`

                        );
                    }

                    // ==================================
                    // KICK
                    // ==================================

                    if (
                        type === 'kick'
                    ) {

                        if (!member) {

                            return interaction.reply({

                                content:
                                    '❌ Usuário não encontrado.',

                                ephemeral: true

                            });
                        }

                        if (
                            !member.kickable
                        ) {

                            return interaction.reply({

                                content:
                                    '❌ Não posso expulsar esse usuário.',

                                ephemeral: true

                            });
                        }

                        await member.kick(
                            reason
                        );

                        return interaction.reply(

                            `👢 ${member.user.tag} foi expulso.\n📝 Motivo: ${reason}`

                        );
                    }

                    // ==================================
                    // TIMEOUT
                    // ==================================

                    if (
                        type === 'timeout'
                    ) {

                        if (!member) {

                            return interaction.reply({

                                content:
                                    '❌ Usuário não encontrado.',

                                ephemeral: true

                            });
                        }

                        const minutes =
                            parseInt(

                                interaction.fields
                                    .getTextInputValue(
                                        'duration'
                                    )

                            );

                        if (

                            isNaN(
                                minutes
                            ) ||

                            minutes <= 0 ||

                            minutes > 40320

                        ) {

                            return interaction.reply({

                                content:
                                    '❌ A duração deve estar entre 1 e 40320 minutos.',

                                ephemeral: true

                            });
                        }

                        await member.timeout(

                            minutes *
                            60 *
                            1000,

                            reason

                        );

                        return interaction.reply(

                            `⏳ ${member.user.tag} recebeu timeout por **${minutes} minutos**.\n📝 Motivo: ${reason}`

                        );
                    }

                    // ==================================
                    // REMOVE TIMEOUT
                    // ==================================

                    if (
                        type ===
                        'untimeout'
                    ) {

                        if (!member) {

                            return interaction.reply({

                                content:
                                    '❌ Usuário não encontrado.',

                                ephemeral: true

                            });
                        }

                        await member.timeout(

                            null,

                            reason

                        );

                        return interaction.reply(

                            `🔓 Timeout removido de ${member.user.tag}.`

                        );
                    }

                    // ==================================
                    // WARN
                    // ==================================

                    if (
                        type === 'warn'
                    ) {

                        if (!member) {

                            return interaction.reply({

                                content:
                                    '❌ Usuário não encontrado.',

                                ephemeral: true

                            });
                        }

                        if (
                            !advertencias[
                                interaction.guild.id
                            ]
                        ) {

                            advertencias[
                                interaction.guild.id
                            ] = {};

                        }

                        if (

                            !advertencias[
                                interaction.guild.id
                            ][member.id]

                        ) {

                            advertencias[
                                interaction.guild.id
                            ][member.id] = [];

                        }

                        advertencias[
                            interaction.guild.id
                        ][member.id].push({

                            reason,

                            moderator:
                                interaction.user.id,

                            date:
                                new Date()
                                    .toISOString()

                        });

                        saveJSON(

                            WARN_FILE,

                            advertencias

                        );

                        return interaction.reply(

                            `⚠️ ${member.user.tag} recebeu uma advertência.\n📝 Motivo: ${reason}`

                        );
                    }

                    // ==================================
                    // VER WARNS
                    // ==================================

                    if (
                        type ===
                        'warns'
                    ) {

                        const data =
                            advertencias[
                                interaction.guild.id
                            ]?.[
                                userId
                            ] || [];

                        if (
                            !data.length
                        ) {

                            return interaction.reply({

                                content:
                                    '📋 Esse usuário não possui advertências.',

                                ephemeral: true

                            });
                        }

                        const text =
                            data
                                .map(

                                    (warn, index) =>

                                        `**${index + 1}.** ${warn.reason}\n` +

                                        `👮 <@${warn.moderator}>`

                                )
                                .join(
                                    '\n\n'
                                );

                        return interaction.reply({

                            content:

                                `📋 Advertências de <@${userId}>:\n\n${text}`,

                            ephemeral: true

                        });
                    }

                    // ==================================
                    // REMOVE WARN
                    // ==================================

                    if (
                        type ===
                        'delwarn'
                    ) {

                        const data =
                            advertencias[
                                interaction.guild.id
                            ]?.[
                                userId
                            ];

                        if (

                            !data ||

                            !data.length

                        ) {

                            return interaction.reply({

                                content:
                                    '❌ Esse usuário não possui advertências.',

                                ephemeral: true

                            });
                        }

                        data.pop();

                        saveJSON(

                            WARN_FILE,

                            advertencias

                        );

                        return interaction.reply(

                            `🗑️ A última advertência de <@${userId}> foi removida.`

                        );
                    }
                }

                // ======================================
                // SORTEIO
                // ======================================

                if (

                    interaction.customId ===
                    'giveaway_modal'

                ) {

                    if (

                        !isStaff(
                            interaction.member
                        )

                    ) {

                        return interaction.reply({

                            content:
                                '❌ Você não tem permissão.',

                            ephemeral: true

                        });
                    }

                    return createGiveaway(
                        interaction
                    );
                }
            }

        } catch (error) {

            console.error(

                '❌ Erro na interação:',

                error

            );

            if (

                !interaction.replied &&

                !interaction.deferred

            ) {

                await interaction.reply({

                    content:
                        '❌ Ocorreu um erro ao executar essa função.',

                    ephemeral: true

                }).catch(
                    () => {}
                );
            }
        }
    }
);

// ======================================================
// ANTI-SPAM
// ======================================================

const spamMap =
    new Map();

client.on(
    'messageCreate',
    async message => {

        if (

            message.author.bot ||

            !message.guild

        ) {

            return;
        }

        const cfg =
            getConfig(
                message.guild.id
            );

        if (
            !cfg.protecao.antiSpam
        ) {

            return;
        }

        const userId =
            message.author.id;

        const now =
            Date.now();

        if (
            !spamMap.has(
                userId
            )
        ) {

            spamMap.set(
                userId,
                []
            );
        }

        const messages =
            spamMap.get(
                userId
            );

        messages.push(
            now
        );

        const recent =
            messages.filter(

                time =>
                    now - time < 5000

            );

        spamMap.set(
            userId,
            recent
        );

        if (

            recent.length >= 6 &&

            message.member

        ) {

            try {

                await message.member.timeout(

                    10000,

                    'Anti-Spam do Seraphins'

                );

                await message.channel.send(

                    `🛡️ ${message.author} recebeu timeout por spam.`

                );

                spamMap.delete(
                    userId
                );

            } catch {}
        }
    }
);

// ======================================================
// ANTI-RAID
// ======================================================

const joinMap =
    new Map();

client.on(
    'guildMemberAdd',
    async member => {

        const cfg =
            getConfig(
                member.guild.id
            );

        if (
            !cfg.protecao.antiRaid
        ) {

            return;
        }

        const now =
            Date.now();

        if (
            !joinMap.has(
                member.guild.id
            )
        ) {

            joinMap.set(
                member.guild.id,
                []
            );
        }

        const joins =
            joinMap.get(
                member.guild.id
            );

        joins.push(
            now
        );

        const recent =
            joins.filter(

                time =>
                    now - time < 10000

            );

        joinMap.set(

            member.guild.id,

            recent

        );

        if (
            recent.length >= 10
        ) {

            try {

                const role =
                    member.guild.roles.cache.find(

                        r =>
                            r.name
                                .toLowerCase()
                                .includes(
                                    'verificação'
                                )

                    );

                if (role) {

                    await member.roles.add(
                        role
                    );

                }

            } catch {}
        }
    }
);

// ======================================================
// LOGIN
// ======================================================

client.login(
    TOKEN
);
