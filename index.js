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
    StringSelectMenuOptionBuilder,
    RoleSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;

const ADM_ROLE_ID = '1454153278060367933';
const STAFF_ROLE_ID = '1556456154643697797';
const OFFICIAL_SERVER_ID = '1401231514812809256';

const TICKET_BANNER_URL = 'https://cdn.imgchest.com/files/52cd34cf74ad.png';

const TICKET_TYPES = {
    parceria: 'Parceria',
    duvida: 'DÃºvida',
    denuncia: 'DenÃºncia'
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
            fs.writeFileSync(
                filePath,
                JSON.stringify(fallback, null, 2)
            );

            return fallback;
        }

        return JSON.parse(
            fs.readFileSync(filePath, 'utf8')
        );
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

const advertencias =
    loadJSON('advertencias.json', {});

const sorteios =
    loadJSON('sorteios.json', {});

const convites =
    loadJSON('convites.json', {});

// ConfiguraÃ§Ã£o do Painel de Compras, separada por servidor.
const lojas =
    loadJSON('lojas.json', {});

function getLoja(guildId) {
    if (!lojas[guildId]) {
        lojas[guildId] = {
            canalId: null,
            messageId: null,
            cargos: {}
        };
    }

    if (!lojas[guildId].cargos) {
        lojas[guildId].cargos = {};
    }

    if (!('canalId' in lojas[guildId])) {
        lojas[guildId].canalId = null;
    }

    if (!('messageId' in lojas[guildId])) {
        lojas[guildId].messageId = null;
    }

    return lojas[guildId];
}

function saveLojas() {
    saveJSON('lojas.json', lojas);
}

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
        member.permissions.has(
            PermissionFlagsBits.Administrator
        ) ||
        member.roles.cache.has(ADM_ROLE_ID) ||
        member.roles.cache.has(STAFF_ROLE_ID)
    );
}

function formatTime(ms) {
    const seconds =
        Math.floor(ms / 1000);

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}min`;
    }

    const hours =
        Math.floor(minutes / 60);

    return `${hours}h`;
}

function randomItem(array) {
    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

/* =========================
   PAINEL PRINCIPAL
========================= */

function mainPanel() {
    const embed = new EmbedBuilder()
        .setTitle('Seraphins')
        .setDescription(
            'Painel de gerenciamento do servidor\n\n' +
            'Escolha uma categoria abaixo para acessar as funÃ§Ãµes disponÃ­veis.'
        )
        .setColor('#000000');

    const row1 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_mod')
                .setLabel('ModeraÃ§Ã£o')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('panel_ticket')
                .setLabel('Tickets')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('panel_protection')
                .setLabel('ProteÃ§Ã£o')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('panel_giveaway')
                .setLabel('Sorteios')
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_server')
                .setLabel('Servidor')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('panel_fun')
                .setLabel('DiversÃ£o')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('panel_config')
                .setLabel('ConfiguraÃ§Ãµes')
                .setStyle(ButtonStyle.Secondary)
        );

    const row3 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_compras')
                .setLabel('Painel de Compras')
                .setStyle(ButtonStyle.Success)
        );

    return {
        embeds: [embed],
        components: [row1, row2, row3]
    };
}

/* =========================
   MODERAÃ‡ÃƒO
========================= */

function moderationPanel() {
    const embed = new EmbedBuilder()
        .setTitle('ðŸ›¡ï¸ ModeraÃ§Ã£o')
        .setDescription(
            'Ferramentas de moderaÃ§Ã£o do servidor.\n\n' +
            'Selecione uma aÃ§Ã£o abaixo.'
        )
        .setColor('#000000');

    const row1 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_ban')
                .setLabel('Banir')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('mod_kick')
                .setLabel('Expulsar')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('mod_timeout')
                .setLabel('Timeout')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('mod_untimeout')
                .setLabel('Remover Timeout')
                .setStyle(ButtonStyle.Success)
        );

    const row2 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_warn')
                .setLabel('Advertir')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('mod_warns')
                .setLabel('AdvertÃªncias')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('mod_delwarn')
                .setLabel('Remover AdvertÃªncia')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('mod_lock')
                .setLabel('Bloquear Canal')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('mod_unlock')
                .setLabel('Desbloquear Canal')
                .setStyle(ButtonStyle.Success)
        );

    const row3 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_slowmode')
                .setLabel('Slowmode')
                .setStyle(ButtonStyle.Secondary)
        );

    return {
        embeds: [embed],
        components: [row1, row2, row3]
    };
}

function moderationModal(type) {
    const modal =
        new ModalBuilder();

    const userInput =
        new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID do usuÃ¡rio')
            .setPlaceholder(
                'Digite o ID do usuÃ¡rio'
            )
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

    const reasonInput =
        new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Motivo')
            .setPlaceholder(
                'Digite o motivo'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(false);

    if (type === 'ban') {
        modal
            .setCustomId('modal_ban')
            .setTitle('Banir usuÃ¡rio')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput),

                new ActionRowBuilder()
                    .addComponents(reasonInput)
            );
    }

    if (type === 'kick') {
        modal
            .setCustomId('modal_kick')
            .setTitle('Expulsar usuÃ¡rio')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput),

                new ActionRowBuilder()
                    .addComponents(reasonInput)
            );
    }

    if (type === 'timeout') {
        const durationInput =
            new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('DuraÃ§Ã£o em segundos')
                .setPlaceholder('Ex: 60')
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(true);

        modal
            .setCustomId('modal_timeout')
            .setTitle('Aplicar timeout')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput),

                new ActionRowBuilder()
                    .addComponents(durationInput),

                new ActionRowBuilder()
                    .addComponents(reasonInput)
            );
    }

    if (type === 'untimeout') {
        modal
            .setCustomId('modal_untimeout')
            .setTitle('Remover timeout')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput),

                new ActionRowBuilder()
                    .addComponents(reasonInput)
            );
    }

    if (type === 'warn') {
        modal
            .setCustomId('modal_warn')
            .setTitle('Advertir usuÃ¡rio')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput),

                new ActionRowBuilder()
                    .addComponents(reasonInput)
            );
    }

    if (type === 'warns') {
        modal
            .setCustomId('modal_warns')
            .setTitle('Ver advertÃªncias')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput)
            );
    }

    if (type === 'delwarn') {
        modal
            .setCustomId('modal_delwarn')
            .setTitle('Remover advertÃªncia')
            .addComponents(
                new ActionRowBuilder()
                    .addComponents(userInput)
            );
    }

    return modal;
}

/* =========================
   TICKETS
========================= */

function ticketPanel() {
    const embed =
        new EmbedBuilder()
            .setTitle('Tickets')
            .setDescription(
                'Configure o sistema de tickets do Seraphins.\n\n' +
                '**Canal:** onde o painel serÃ¡ enviado\n' +
                '**Categoria:** onde os tickets serÃ£o criados\n' +
                '**Cargo ADM:** quem terÃ¡ acesso aos tickets'
            )
            .setColor('#000000');

    const row1 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(
                    'ticket_set_channel'
                )
                .setLabel('Definir Canal')
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    'ticket_set_category'
                )
                .setLabel('Definir Categoria')
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    'ticket_set_role'
                )
                .setLabel('Definir Cargo ADM')
                .setStyle(
                    ButtonStyle.Primary
                )
        );

    const row2 =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(
                    'ticket_send_panel'
                )
                .setLabel(
                    'Enviar Painel de Suporte'
                )
                .setStyle(
                    ButtonStyle.Success
                )
        );

    return {
        embeds: [embed],
        components: [row1, row2]
    };
}

function ticketOpenPanel() {
    const embed =
        new EmbedBuilder()
            .setTitle('Suporte')
            .setDescription(
                'Precisa de ajuda?\n\n' +
                'Escolha abaixo o tipo de atendimento que vocÃª precisa.\n\n' +
                '**Parceria**\n' +
                'Para assuntos relacionados a parcerias.\n\n' +
                '**DÃºvida**\n' +
                'Para tirar dÃºvidas ou pedir ajuda.\n\n' +
                '**DenÃºncia**\n' +
                'Para denunciar usuÃ¡rios ou situaÃ§Ãµes.'
            )
            .setColor('#000000');

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
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(
                    'open_ticket_parceria'
                )
                .setLabel('Parceria')
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    'open_ticket_duvida'
                )
                .setLabel('DÃºvida')
                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    'open_ticket_denuncia'
                )
                .setLabel('DenÃºncia')
                .setStyle(
                    ButtonStyle.Danger
                )
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

async function openTicket(
    interaction,
    type = 'duvida'
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild =
        interaction.guild;

    const cfg =
        getConfig(guild.id);

    const ticketType =
        TICKET_TYPES[type] ||
        TICKET_TYPES.duvida;

    const existing =
        guild.channels.cache.find(
            channel =>
                channel.type ===
                    ChannelType.GuildText &&
                channel.topic ===
                    `seraphins-ticket:${interaction.user.id}`
        );

    if (existing) {
        return safeInteractionReply(interaction, {
            content:
                `VocÃª jÃ¡ possui um ticket aberto: ${existing}`,
            flags: MessageFlags.Ephemeral
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

    let username =
        interaction.user.username
            .toLowerCase()
            .replace(
                /[^a-z0-9-]/g,
                ''
            )
            .slice(0, 50);

    if (!username) {
        username = 'usuario';
    }

    const channel =
        await guild.channels.create({
            name:
                `${type}-${username}`
                    .slice(0, 100),

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
                `Suporte â€¢ ${ticketType}`
            )
            .setDescription(
                `OlÃ¡ ${interaction.user}!\n\n` +
                `Seu atendimento foi aberto na categoria **${ticketType}**.\n\n` +
                'Explique sua situaÃ§Ã£o abaixo.\n' +
                'Um membro da equipe irÃ¡ atendÃª-lo.\n\n' +
                '**Assumir Ticket**\n' +
                '**Chamar ADM**\n' +
                '**Fechar Ticket**'
            )
            .setColor('#000000');

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
                    .setStyle(
                        ButtonStyle.Danger
                    )
            );

    await channel.send({
        content: role
            ? `${role} ${interaction.user}`
            : `${interaction.user}`,

        embeds: [embed],
        components: [buttons]
    });

    return safeInteractionReply(interaction, {
        content:
            `Ticket de ${ticketType} criado: ${channel}`,
        flags: MessageFlags.Ephemeral
    });
}

/* =========================
   PAINEL DE COMPRAS
========================= */

function purchaseConfigPanel(guild) {
    const loja = getLoja(guild.id);
    const channel = loja.canalId
        ? guild.channels.cache.get(loja.canalId)
        : null;

    const cargos = Object.entries(loja.cargos || {});
    const cargoText = cargos.length
        ? cargos.slice(0, 15).map(([roleId, data]) => {
            const role = guild.roles.cache.get(roleId);
            const price = Number(data.price || 0).toFixed(2).replace('.', ',');
            return `â€¢ ${role ? role.name : `Cargo removido (${roleId})`} â€” R$ ${price}`;
        }).join('\n')
        : 'Nenhum cargo configurado ainda.';

    const embed = new EmbedBuilder()
        .setTitle('ðŸ›’ Painel de Compras')
        .setDescription(
            `Configure os cargos que serÃ£o vendidos e o canal da loja.\n\n` +
            `**Canal da loja:** ${channel ? channel.toString() : 'NÃ£o definido'}\n\n` +
            `**Cargos e preÃ§os:**\n${cargoText}` +
            (cargos.length > 15 ? `\n... e mais ${cargos.length - 15} cargo(s).` : '')
        )
        .setColor('#000000');

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('shop_add_role')
            .setLabel('Adicionar/Editar Cargo')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('shop_remove_role')
            .setLabel('Remover Cargo')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('shop_set_channel')
            .setLabel('Definir Canal')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('shop_publish')
            .setLabel('Publicar/Atualizar Loja')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('shop_back')
            .setLabel('Voltar')
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row1, row2],
        flags: MessageFlags.Ephemeral
    };
}

function purchaseRoleSelect(guild, mode) {
    const menu = new RoleSelectMenuBuilder()
        .setCustomId(
            mode === 'remove' ? 'shop_select_remove' : 'shop_select_price'
        )
        .setPlaceholder(
            mode === 'remove'
                ? 'Selecione o cargo que deseja remover'
                : 'Selecione o cargo que deseja vender'
        )
        .setMinValues(1)
        .setMaxValues(1);

    return {
        content: mode === 'remove'
            ? 'Selecione um cargo que jÃ¡ esteja cadastrado na loja.'
            : 'Selecione o cargo que deseja cadastrar ou editar o preÃ§o.',
        components: [
            new ActionRowBuilder().addComponents(menu)
        ],
        flags: MessageFlags.Ephemeral
    };
}

function purchaseStorePanel(guild) {
    const loja = getLoja(guild.id);
    const entries = Object.entries(loja.cargos || {})
        .filter(([roleId]) => {
            const role = guild.roles.cache.get(roleId);
            return role && role.id !== guild.id && !role.managed;
        })
        .slice(0, 25);

    const embed = new EmbedBuilder()
        .setTitle(`ðŸ›’ Loja de ${guild.name}`)
        .setDescription(
            entries.length
                ? 'Selecione abaixo o cargo que deseja comprar. Um ticket serÃ¡ criado para o atendimento e confirmaÃ§Ã£o do pagamento.'
                : 'A loja ainda nÃ£o possui cargos disponÃ­veis.'
        )
        .setColor('#000000');

    const components = [];

    if (entries.length) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId('shop_customer_select')
            .setPlaceholder('Escolha um cargo para comprar')
            .addOptions(
                entries.map(([roleId, data]) => {
                    const role = guild.roles.cache.get(roleId);
                    const price = Number(data.price || 0).toFixed(2).replace('.', ',');
                    return new StringSelectMenuOptionBuilder()
                        .setLabel((role.name || 'Cargo').slice(0, 100))
                        .setDescription(`PreÃ§o: R$ ${price}`.slice(0, 100))
                        .setValue(roleId);
                })
            );

        components.push(
            new ActionRowBuilder().addComponents(menu)
        );
    }

    return {
        embeds: [embed],
        components
    };
}

async function openPurchaseTicket(interaction, roleId) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const loja = getLoja(guild.id);
    const role = guild.roles.cache.get(roleId);
    const roleData = loja.cargos[roleId];

    if (!role || !roleData) {
        return safeInteractionReply(interaction, {
            content: 'Esse cargo nÃ£o estÃ¡ mais disponÃ­vel na loja.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (role.id === guild.id || role.managed) {
        return safeInteractionReply(interaction, {
            content: 'Esse cargo nÃ£o pode ser vendido.',
            flags: MessageFlags.Ephemeral
        });
    }

    const existing = guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText &&
        channel.topic === `seraphins-purchase:${interaction.user.id}:${roleId}`
    );

    if (existing) {
        return safeInteractionReply(interaction, {
            content: `VocÃª jÃ¡ possui um ticket de compra aberto para esse cargo: ${existing}`,
            flags: MessageFlags.Ephemeral
        });
    }

    const config = getConfig(guild.id);
    const adminRoleId = config.ticketCargo || ADM_ROLE_ID;
    const adminRole = guild.roles.cache.get(adminRoleId);

    const safeRoleName = role.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30) || 'cargo';

    const safeUsername = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30) || 'usuario';

    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: interaction.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
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
    ];

    if (adminRole) {
        overwrites.push({
            id: adminRole.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    }

    let channel;

    try {
        channel = await guild.channels.create({
            name: `compra-${safeRoleName}-${safeUsername}`.slice(0, 100),
            type: ChannelType.GuildText,
            topic: `seraphins-purchase:${interaction.user.id}:${roleId}`,
            permissionOverwrites: overwrites
        });
    } catch (error) {
        console.error('Erro ao criar ticket de compra:', error);
        return safeInteractionReply(interaction, {
            content: 'NÃ£o consegui criar o ticket. Verifique as permissÃµes do bot.',
            flags: MessageFlags.Ephemeral
        });
    }

    const price = Number(roleData.price || 0).toFixed(2).replace('.', ',');
    const embed = new EmbedBuilder()
        .setTitle('ðŸ›’ SolicitaÃ§Ã£o de compra')
        .setDescription(
            `**Cliente:** ${interaction.user}\n` +
            `**Cargo:** ${role}\n` +
            `**PreÃ§o:** R$ ${price}\n\n` +
            'A equipe deve confirmar o pagamento antes de entregar o cargo. Este bot nÃ£o confirma pagamentos automaticamente.'
        )
        .setColor('#000000')
        .setTimestamp();

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
        content: adminRole ? `${adminRole}` : '',
        embeds: [embed],
        components: [buttons]
    });

    return safeInteractionReply(interaction, {
        content: `Seu ticket de compra foi criado: ${channel}`,
        flags: MessageFlags.Ephemeral
    });
}

/* =========================
   SERVIDOR
========================= */

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

    const embed =
        new EmbedBuilder()
            .setTitle(
                `ðŸ“Š ${guild.name}`
            )
            .setThumbnail(
                guild.iconURL({
                    dynamic: true
                })
            )
            .setColor('#000000')
            .addFields(
                {
                    name: 'ðŸ‘¥ Membros',
                    value:
                        `${guild.memberCount}`,
                    inline: true
                },

                {
                    name: 'ðŸ‘¤ Humanos',
                    value:
                        `${humans}`,
                    inline: true
                },

                {
                    name: 'ðŸ¤– Bots',
                    value:
                        `${bots}`,
                    inline: true
                },

                {
                    name: 'ðŸ’¬ Canais',
                    value:
                        `${guild.channels.cache.size}`,
                    inline: true
                },

                {
                    name: 'ðŸŽ­ Cargos',
                    value:
                        `${guild.roles.cache.size}`,
                    inline: true
                },

                {
                    name: 'ðŸš€ Boosts',
                    value:
                        `${guild.premiumSubscriptionCount || 0}`,
                    inline: true
                },

                {
                    name: 'ðŸ‘‘ Dono',
                    value:
                        `<@${guild.ownerId}>`,
                    inline: true
                },

                {
                    name: 'ðŸ“… Criado em',
                    value:
                        `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
                    inline: true
                },

                {
                    name: 'ðŸ†” ID',
                    value: guild.id,
                    inline: true
                }
            );

    return {
        embeds: [embed]
    };
}

/* =========================
   DIVERSÃƒO
========================= */

function funPanel() {
    const embed =
        new EmbedBuilder()
            .setTitle('ðŸŽ‰ DiversÃ£o')
            .setDescription(
                'Escolha uma das opÃ§Ãµes abaixo.'
            )
            .setColor('#000000');

    const row =
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'fun_dice'
                    )
                    .setLabel('Dado')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_coin'
                    )
                    .setLabel('Moeda')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_8ball'
                    )
                    .setLabel('8Ball')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_number'
                    )
                    .setLabel('NÃºmero')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_choose'
                    )
                    .setLabel('Escolher')
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'fun_quiz'
                    )
                    .setLabel('Quiz')
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );

    return {
        embeds: [embed],
        components: [row]
    };
}

/* =========================
   CONFIGURAÃ‡Ã•ES
========================= */

function configPanel(guild) {
    const cfg =
        getConfig(guild.id);

    const embed =
        new EmbedBuilder()
            .setTitle(
                'âš™ï¸ ConfiguraÃ§Ãµes'
            )
            .setDescription(
                'ConfiguraÃ§Ãµes atuais do Seraphins.'
            )
            .setColor('#000000')
            .addFields(
                {
                    name:
                        'Canal de Tickets',
                    value:
                        cfg.ticketCanal
                            ? `<#${cfg.ticketCanal}>`
                            : 'NÃ£o definido',
                    inline: true
                },

                {
                    name: 'Categoria',
                    value:
                        cfg.ticketCategoria
                            ? `<#${cfg.ticketCategoria}>`
                            : 'NÃ£o definida',
                    inline: true
                },

                {
                    name:
                        'Cargo ADM',
                    value:
                        cfg.ticketCargo
                            ? `<@&${cfg.ticketCargo}>`
                            : 'NÃ£o definido',
                    inline: true
                },

                {
                    name:
                        'ðŸ›¡ï¸ Anti-Spam',
                    value:
                        cfg.antiSpam
                            ? 'Ativado'
                            : 'Desativado',
                    inline: true
                },

                {
                    name:
                        'ðŸš¨ Anti-Raid',
                    value:
                        cfg.antiRaid
                            ? 'Ativado'
                            : 'Desativado',
                    inline: true
                }
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'config_tickets'
                    )
                    .setLabel('Tickets')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'config_protection'
                    )
                    .setLabel('ProteÃ§Ã£o')
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );

    return {
        embeds: [embed],
        components: [row]
    };
}

/* =========================
   PROTEÃ‡ÃƒO
========================= */

function protectionPanel(guild) {
    const cfg =
        getConfig(guild.id);

    const embed =
        new EmbedBuilder()
            .setTitle(
                'ðŸ›¡ï¸ ProteÃ§Ã£o'
            )
            .setDescription(
                'Configure os sistemas de proteÃ§Ã£o do servidor.'
            )
            .setColor('#000000')
            .addFields(
                {
                    name:
                        'Anti-Spam',
                    value:
                        cfg.antiSpam
                            ? 'ðŸŸ¢ Ativado'
                            : 'ðŸ”´ Desativado',
                    inline: true
                },

                {
                    name:
                        'Anti-Raid',
                    value:
                        cfg.antiRaid
                            ? 'ðŸŸ¢ Ativado'
                            : 'ðŸ”´ Desativado',
                    inline: true
                }
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'toggle_spam'
                    )
                    .setLabel(
                        'Alternar Anti-Spam'
                    )
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'toggle_raid'
                    )
                    .setLabel(
                        'Alternar Anti-Raid'
                    )
                    .setStyle(
                        ButtonStyle.Danger
                    )
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
    const embed =
        new EmbedBuilder()
            .setTitle('ðŸŽ Sorteios')
            .setDescription(
                'Gerencie os sorteios do servidor.\n\n' +
                'Crie sorteios definindo prÃªmio, duraÃ§Ã£o, vencedores e requisitos.'
            )
            .setColor('#000000');

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
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );

    return {
        embeds: [embed],
        components: [row]
    };
}

function giveawayCreateModal() {
    const modal =
        new ModalBuilder()
            .setCustomId(
                'modal_giveaway'
            )
            .setTitle(
                'Criar Sorteio'
            );

    const prize =
        new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('PrÃªmio')
            .setPlaceholder(
                'Ex: Nitro, Robux, cargo especial'
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
                'DuraÃ§Ã£o em minutos'
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

    const requirements =
        new TextInputBuilder()
            .setCustomId(
                'requirements'
            )
            .setLabel(
                'Requisitos'
            )
            .setPlaceholder(
                'Ex: Cargo @Membro ou 7 dias no servidor'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(false);

    return modal.addComponents(
        new ActionRowBuilder()
            .addComponents(prize),

        new ActionRowBuilder()
            .addComponents(duration),

        new ActionRowBuilder()
            .addComponents(winners),

        new ActionRowBuilder()
            .addComponents(requirements)
    );
}

function parseGiveawayRequirements(
    requirements
) {
    const result = {
        roleId: null,
        minDays: 0,
        minInvites: 0,
        text:
            requirements?.trim() ||
            'Nenhum requisito'
    };

    if (!requirements) {
        return result;
    }

    const roleMatch =
        requirements.match(
            /(?:<@&(\d+)>|cargo\s*(?:id)?\s*[:=]?\s*(\d+))/i
        );

    if (roleMatch) {
        result.roleId =
            roleMatch[1] ||
            roleMatch[2];
    }

    const daysMatch =
        requirements.match(
            /(\d+)\s*(?:dias?|day|days)/i
        );

    if (daysMatch) {
        result.minDays =
            Number(daysMatch[1]);
    }

    const invitesMatch =
        requirements.match(
            /(\d+)\s*(?:convites?|invites?)/i
        );

    if (invitesMatch) {
        result.minInvites =
            Number(invitesMatch[1]);
    }

    return result;
}

function giveawayMessage(giveaway) {
    const requirements =
        giveaway.requirements?.trim() ||
        'Nenhum requisito';

    return new EmbedBuilder()
        .setTitle('ðŸŽ Sorteio')
        .setDescription(
            `**PrÃªmio:** ${giveaway.prize}\n\n` +
            `**Vencedores:** ${giveaway.winners}\n` +
            `**Requisitos:** ${requirements}\n\n` +
            `**Participantes:** ${
                giveaway.participants?.length || 0
            }\n\n` +
            `**Termina:** <t:${Math.floor(
                giveaway.end / 1000
            )}:R>\n\n` +
            'Clique no botÃ£o abaixo para participar.'
        )
        .setColor('#000000');
}

function giveawayButtons(
    giveawayId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `giveaway_join_${giveawayId}`
                )
                .setLabel(
                    'Participar'
                )
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    `giveaway_list_${giveawayId}`
                )
                .setLabel('Ver participantes')
                .setStyle(ButtonStyle.Secondary)
        );
}

async function checkGiveawayRequirement(
    member,
    giveaway
) {
    if (!member) {
        return {
            ok: false,
            reason:
                'VocÃª precisa estar no servidor para participar.'
        };
    }

    if (member.user.bot) {
        return {
            ok: false,
            reason:
                'Bots nÃ£o podem participar de sorteios.'
        };
    }

    if (
        giveaway.requiredRole &&
        !member.roles.cache.has(
            giveaway.requiredRole
        )
    ) {
        return {
            ok: false,
            reason:
                `VocÃª precisa possuir o cargo <@&${giveaway.requiredRole}> para participar.`
        };
    }

    if (
        giveaway.minDays &&
        member.joinedTimestamp
    ) {
        const days =
            (Date.now() -
                member.joinedTimestamp) /
            86400000;

        if (
            days <
            giveaway.minDays
        ) {
            return {
                ok: false,
                reason:
                    `VocÃª precisa estar no servidor hÃ¡ pelo menos ${giveaway.minDays} dias.`
            };
        }
    }

    return {
        ok: true
    };
}

async function checkGiveawayWinnerRequirement(
    guild,
    userId,
    giveaway
) {
    const member =
        guild.members.cache.get(userId) ||
        await guild.members.fetch(userId).catch(() => null);

    if (!member) {
        return {
            ok: false,
            reason: 'A pessoa sorteada nÃ£o estÃ¡ mais no servidor.'
        };
    }

    const base = await checkGiveawayRequirement(member, giveaway);
    if (!base.ok) return base;

    if (giveaway.minInvites > 0) {
        const invites = await getUserInvites(guild, userId);
        if (invites < giveaway.minInvites) {
            return {
                ok: false,
                reason: `A pessoa sorteada possui **${invites}** convite(s), mas precisa de **${giveaway.minInvites}**.`
            };
        }
    }

    return { ok: true };
}

function randomParticipant(guild, giveaway, excluded = []) {
    const eligible = getEligibleParticipants(guild, giveaway)
        .filter(id => !excluded.includes(id));

    return eligible.length ? randomItem(eligible) : null;
}

async function updateGiveawayMessage(guild, giveaway, embed, components = []) {
    const channel = guild.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    try {
        const message = await channel.messages.fetch(giveaway.messageId);
        await message.edit({
            embeds: [embed],
            components
        });
    } catch (error) {
        console.log('NÃ£o foi possÃ­vel atualizar a mensagem do sorteio:', error.message);
    }
}

function endedGiveawayEmbed(giveaway, winnerText, extra = '') {
    return new EmbedBuilder()
        .setTitle('ðŸŽ Sorteio Encerrado')
        .setDescription(
            `**PrÃªmio:** ${giveaway.prize}\n\n` +
            `**Vencedor:** ${winnerText}\n\n` +
            `**Participantes:** ${giveaway.participants?.length || 0}` +
            (extra ? `\n\n${extra}` : '')
        )
        .setColor('#000000');
}

function getEligibleParticipants(
    guild,
    giveaway
) {
    const participants =
        Array.isArray(
            giveaway.participants
        )
            ? giveaway.participants
            : [];

    return participants.filter(
        userId => {
            const member =
                guild.members.cache.get(
                    userId
                );

            if (!member) {
                return false;
            }

            if (member.user.bot) {
                return false;
            }

            if (
                giveaway.requiredRole &&
                !member.roles.cache.has(
                    giveaway.requiredRole
                )
            ) {
                return false;
            }

            if (
                giveaway.minDays &&
                member.joinedTimestamp
            ) {
                const days =
                    (Date.now() -
                        member.joinedTimestamp) /
                    86400000;

                if (
                    days <
                    giveaway.minDays
                ) {
                    return false;
                }
            }

            return true;
        }
    );
}

async function finishGiveaway(
    giveawayId
) {
    const giveaway = sorteios[giveawayId];
    if (!giveaway || giveaway.finished) return;

    const guild = client.guilds.cache.get(giveaway.guildId);
    if (!guild) {
        delete sorteios[giveawayId];
        saveJSON('sorteios.json', sorteios);
        return;
    }

    giveaway.finished = true;
    giveaway.rejectedParticipants = Array.isArray(giveaway.rejectedParticipants)
        ? giveaway.rejectedParticipants
        : [];

    const candidate = randomParticipant(
        guild,
        giveaway,
        giveaway.rejectedParticipants
    );

    if (!candidate) {
        await updateGiveawayMessage(
            guild,
            giveaway,
            endedGiveawayEmbed(
                giveaway,
                'Nenhum vencedor',
                'NÃ£o houve participantes elegÃ­veis.'
            )
        );
        delete sorteios[giveawayId];
        saveJSON('sorteios.json', sorteios);
        return;
    }

    const requirement = await checkGiveawayWinnerRequirement(
        guild,
        candidate,
        giveaway
    );

    if (!requirement.ok) {
        giveaway.pendingCandidate = candidate;
        giveaway.rejectedParticipants.push(candidate);
        saveJSON('sorteios.json', sorteios);

        await updateGiveawayMessage(
            guild,
            giveaway,
            endedGiveawayEmbed(
                giveaway,
                `<@${candidate}>`,
                `âš ï¸ A pessoa sorteada nÃ£o cumpriu o requisito.\n${requirement.reason}\n\nClique em **Girar outra pessoa** para sortear outro participante.`
            ),
            [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_reroll_${giveawayId}`)
                        .setLabel('Girar outra pessoa')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`giveaway_list_${giveawayId}`)
                        .setLabel('Ver participantes')
                        .setStyle(ButtonStyle.Secondary)
                )
            ]
        );
        return;
    }

    giveaway.winner = candidate;
    saveJSON('sorteios.json', sorteios);

    await updateGiveawayMessage(
        guild,
        giveaway,
        endedGiveawayEmbed(giveaway, `<@${candidate}>`)
    );

    const channel = guild.channels.cache.get(giveaway.channelId);
    if (channel) {
        try {
            await channel.send(
                `ðŸŽ‰ **Sorteio encerrado!**\n\n**PrÃªmio:** ${giveaway.prize}\n**Vencedor:** <@${candidate}>`
            );
        } catch {}
    }

    delete sorteios[giveawayId];
    saveJSON('sorteios.json', sorteios);
}

async function rerollGiveaway(giveawayId) {
    const giveaway = sorteios[giveawayId];
    if (!giveaway || !giveaway.finished) return null;

    const guild = client.guilds.cache.get(giveaway.guildId);
    if (!guild) return null;

    const rejected = Array.isArray(giveaway.rejectedParticipants)
        ? giveaway.rejectedParticipants
        : [];

    const candidate = randomParticipant(guild, giveaway, rejected);

    if (!candidate) {
        await updateGiveawayMessage(
            guild,
            giveaway,
            endedGiveawayEmbed(
                giveaway,
                'Nenhum vencedor',
                'Todos os participantes restantes foram eliminados pelos requisitos.'
            )
        );
        delete sorteios[giveawayId];
        saveJSON('sorteios.json', sorteios);
        return null;
    }

    const requirement = await checkGiveawayWinnerRequirement(
        guild,
        candidate,
        giveaway
    );

    if (!requirement.ok) {
        giveaway.pendingCandidate = candidate;
        giveaway.rejectedParticipants = [...rejected, candidate];
        saveJSON('sorteios.json', sorteios);

        await updateGiveawayMessage(
            guild,
            giveaway,
            endedGiveawayEmbed(
                giveaway,
                `<@${candidate}>`,
                `âš ï¸ Essa pessoa tambÃ©m nÃ£o cumpriu o requisito.\n${requirement.reason}\n\nClique em **Girar outra pessoa** para continuar.`
            ),
            [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_reroll_${giveawayId}`)
                        .setLabel('Girar outra pessoa')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`giveaway_list_${giveawayId}`)
                        .setLabel('Ver participantes')
                        .setStyle(ButtonStyle.Secondary)
                )
            ]
        );
        return null;
    }

    giveaway.winner = candidate;
    saveJSON('sorteios.json', sorteios);

    await updateGiveawayMessage(
        guild,
        giveaway,
        endedGiveawayEmbed(giveaway, `<@${candidate}>`)
    );

    const channel = guild.channels.cache.get(giveaway.channelId);
    if (channel) {
        try {
            await channel.send(
                `ðŸŽ‰ **Novo sorteio!**\n\n**PrÃªmio:** ${giveaway.prize}\n**Vencedor:** <@${candidate}>`
            );
        } catch {}
    }

    delete sorteios[giveawayId];
    saveJSON('sorteios.json', sorteios);
    return candidate;
}

function giveawayParticipantList(guild, giveaway, page = 0) {
    const participants = Array.isArray(giveaway.participants)
        ? giveaway.participants
        : [];
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(participants.length / perPage));
    const currentPage = Math.min(Math.max(Number(page) || 0, 0), totalPages - 1);
    const start = currentPage * perPage;
    const slice = participants.slice(start, start + perPage);

    const lines = slice.length
        ? slice.map((id, index) => {
            const member = guild.members.cache.get(id);
            const name = member ? member.displayName : `UsuÃ¡rio ${id}`;
            return `**${start + index + 1}.** ${member ? `${member}` : name}`;
        }).join('\n')
        : 'Nenhuma pessoa estÃ¡ participando.';

    const embed = new EmbedBuilder()
        .setTitle('ðŸ‘¥ Participantes do sorteio')
        .setDescription(
            `**PrÃªmio:** ${giveaway.prize}\n` +
            `**Total:** ${participants.length}\n` +
            `**PÃ¡gina:** ${currentPage + 1}/${totalPages}\n\n` +
            lines
        )
        .setColor('#000000');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`giveaway_list_prev_${giveaway.id}_${currentPage}`)
            .setLabel('Anterior')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage <= 0),
        new ButtonBuilder()
            .setCustomId(`giveaway_list_next_${giveaway.id}_${currentPage}`)
            .setLabel('PrÃ³xima')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages - 1)
    );

    return { embeds: [embed], components: [row], flags: MessageFlags.Ephemeral };
}

function scheduleGiveaway(
    giveawayId
) {
    const giveaway =
        sorteios[giveawayId];

    if (!giveaway) {
        return;
    }

    const remaining =
        giveaway.end -
        Date.now();

    if (remaining <= 0) {
        finishGiveaway(
            giveawayId
        );

        return;
    }

    setTimeout(
        () => {
            finishGiveaway(
                giveawayId
            );
        },
        Math.min(
            remaining,
            2147483647
        )
    );
}

function scheduleAllGiveaways() {
    for (
        const giveawayId of
            Object.keys(sorteios)
    ) {
        const giveaway =
            sorteios[
                giveawayId
            ];

        if (
            !giveaway ||
            giveaway.finished
        ) {
            continue;
        }

        if (
            !Array.isArray(
                giveaway.participants
            )
        ) {
            giveaway.participants =
                [];
        }

        if (
            !giveaway.requirements
        ) {
            giveaway.requirements =
                'Nenhum requisito';
        }

        scheduleGiveaway(
            giveawayId
        );
    }

    saveJSON(
        'sorteios.json',
        sorteios
    );
}

/* =========================
   CONVITES
========================= */

async function loadInvites(
    guild
) {
    try {
        const invites =
            await guild.invites.fetch();

        convites[guild.id] =
            {};

        invites.forEach(
            invite => {
                convites[
                    guild.id
                ][invite.code] = {
                    uses:
                        invite.uses ||
                        0,

                    inviter:
                        invite.inviter?.id ||
                        null
                };
            }
        );

        saveJSON(
            'convites.json',
            convites
        );
    } catch (error) {
        console.log(
            `NÃ£o foi possÃ­vel carregar convites de ${guild.name}`
        );
    }
}

async function getUserInvites(
    guild,
    userId
) {
    let total = 0;

    try {
        const invites =
            await guild.invites.fetch();

        invites.forEach(
            invite => {
                if (
                    invite.inviter?.id ===
                    userId
                ) {
                    total +=
                        invite.uses ||
                        0;
                }
            }
        );
    } catch {}

    return total;
}

/* =========================
   EVENTOS DE MEMBROS
========================= */

const raidTracker =
    new Map();

client.on(
    'guildMemberAdd',
    async member => {
        const guildId =
            member.guild.id;

        const cfg =
            getConfig(guildId);

        if (!cfg.antiRaid) {
            return;
        }

        if (
            !raidTracker.has(
                guildId
            )
        ) {
            raidTracker.set(
                guildId,
                []
            );
        }

        const now =
            Date.now();

        const joins =
            raidTracker
                .get(guildId)
                .filter(
                    timestamp =>
                        now -
                            timestamp <
                        10000
                );

        joins.push(now);

        raidTracker.set(
            guildId,
            joins
        );

        if (
            joins.length >=
            10
        ) {
            const verificationRole =
                member.guild.roles.cache.find(
                    role =>
                        role.name
                            .toLowerCase()
                            .includes(
                                'verificaÃ§Ã£o'
                            )
                );

            if (
                verificationRole
            ) {
                try {
                    await member.roles.add(
                        verificationRole
                    );
                } catch {}
            }
        }
    }
);

/* =========================
   READY
========================= */

client.once(
    'clientReady',
    async () => {
        console.log(
            `ðŸ¤– ${client.user.tag} estÃ¡ online!`
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

        scheduleAllGiveaways();

        console.log(
            'ðŸ“¨ Sistema de convites carregado.'
        );

        console.log(
            'ðŸŽ Sistema de sorteios carregado.'
        );
    }
);

/* =========================
   COMANDOS
========================= */

const commands = [
    {
        name: 'ping',
        description:
            'Verifica a latÃªncia do bot'
    },

    {
        name: 'painel',
        description:
            'Abre o painel do Seraphins'
    },

    {
        name: 'setupticket',
        description:
            'Envia o painel de suporte',

        options: [
            {
                name: 'canal',
                description:
                    'Canal onde o painel serÃ¡ enviado',
                type: 7,
                required: true
            }
        ]
    },

    {
        name: 'convites',
        description:
            'Mostra os convites de um usuÃ¡rio',

        options: [
            {
                name: 'usuario',
                description:
                    'UsuÃ¡rio',
                type: 6,
                required: false
            }
        ]
    }
];

client.once(
    'clientReady',
    async () => {
        try {
            const guild = client.guilds.cache.get(OFFICIAL_SERVER_ID);

            if (guild) {
                await guild.commands.set(commands);
                console.log('Comandos registrados no servidor oficial!');
            } else {
                await client.application.commands.set(commands);
                console.log('Servidor oficial nao encontrado; comandos registrados globalmente.');
            }
        } catch (error) {
            console.error(
                'Erro ao registrar comandos:',
                error
            );
        }
    }
);

/* =========================
   INTERAÃ‡Ã•ES
========================= */

async function safeInteractionReply(interaction, payload) {
    if (interaction.deferred) return interaction.editReply(payload);
    if (interaction.replied) return interaction.followUp(payload);
    return interaction.reply(payload);
}

client.on(
    'interactionCreate',
    async interaction => {
        try {
            /* ===== SLASH COMMANDS ===== */

            if (
                interaction.isChatInputCommand()
            ) {
                if (
                    interaction.commandName ===
                    'ping'
                ) {
                    return safeInteractionReply(interaction, 
                        {
                            content:
                                `Pong! ${client.ws.ping}ms`,
                            flags: MessageFlags.Ephemeral
                        }
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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ VocÃª nÃ£o possui permissÃ£o para usar este comando.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    return safeInteractionReply(interaction, 
                        {
                            ...mainPanel(),
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                if (
                    interaction.commandName ===
                    'setupticket'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'VocÃª nÃ£o possui permissÃ£o para configurar o suporte.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const canal =
                        interaction.options.getChannel(
                            'canal'
                        );

                    if (!canal) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Canal invÃ¡lido.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Eu nÃ£o tenho as permissÃµes necessÃ¡rias nesse canal.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const cfg =
                        getConfig(
                            interaction.guild.id
                        );

                    cfg.ticketCanal =
                        canal.id;

                    try {
                        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                        await canal.send(
                            ticketOpenPanel()
                        );

                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    `Painel de suporte enviado em ${canal}.`,
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    } catch (error) {
                        console.error(
                            'Erro ao enviar painel de suporte:',
                            error
                        );

                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'NÃ£o foi possÃ­vel enviar o painel nesse canal.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }
                }

                if (
                    interaction.commandName ===
                    'convites'
                ) {
                    const user =
                        interaction.options.getUser(
                            'usuario'
                        ) ||
                        interaction.user;

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const total =
                        await getUserInvites(
                            interaction.guild,
                            user.id
                        );

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                `${user} possui **${total}** convite(s).`
                        }
                    );
                }
            }

            /* ===== BOTÃ•ES ===== */

            if (
                interaction.isButton()
            ) {
                /* ===== PAINEL PRINCIPAL ===== */

                if (
                    interaction.customId ===
                    'panel_mod'
                ) {
                    return interaction.update(
                        moderationPanel()
                    );
                }

                if (
                    interaction.customId ===
                    'panel_ticket'
                ) {
                    return interaction.update(
                        ticketPanel()
                    );
                }

                if (
                    interaction.customId ===
                    'panel_protection'
                ) {
                    return interaction.update(
                        protectionPanel(
                            interaction.guild
                        )
                    );
                }

                if (
                    interaction.customId ===
                    'panel_giveaway'
                ) {
                    return interaction.update(
                        giveawayPanel()
                    );
                }

                if (
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
                    interaction.customId ===
                    'panel_fun'
                ) {
                    return interaction.update(
                        funPanel()
                    );
                }

                if (
                    interaction.customId ===
                    'panel_config'
                ) {
                    return interaction.update(
                        configPanel(
                            interaction.guild
                        )
                    );
                }

                if (
                    interaction.customId ===
                    'panel_compras'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ VocÃª nÃ£o possui permissÃ£o para configurar a loja.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    return safeInteractionReply(interaction, 
                        purchaseConfigPanel(interaction.guild)
                    );
                }

                if (
                    interaction.customId ===
                    'shop_back'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    return interaction.update(mainPanel());
                }

                if (
                    interaction.customId ===
                    'shop_add_role'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    return safeInteractionReply(interaction, 
                        purchaseRoleSelect(interaction.guild, 'add')
                    );
                }

                if (
                    interaction.customId ===
                    'shop_remove_role'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (!Object.keys(getLoja(interaction.guild.id).cargos).length) {
                        return safeInteractionReply(interaction, {
                            content: 'Ainda nÃ£o hÃ¡ cargos cadastrados para remover.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    return safeInteractionReply(interaction, 
                        purchaseRoleSelect(interaction.guild, 'remove')
                    );
                }

                if (
                    interaction.customId ===
                    'shop_set_channel'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const modal = new ModalBuilder()
                        .setCustomId('modal_shop_channel')
                        .setTitle('Definir canal da loja');

                    const input = new TextInputBuilder()
                        .setCustomId('channel_id')
                        .setLabel('ID do canal de texto')
                        .setPlaceholder('Cole o ID do canal')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(input)
                    );

                    return interaction.showModal(modal);
                }

                if (
                    interaction.customId ===
                    'shop_publish'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const loja = getLoja(interaction.guild.id);
                    const channel = loja.canalId
                        ? interaction.guild.channels.cache.get(loja.canalId)
                        : null;

                    if (!channel || channel.type !== ChannelType.GuildText) {
                        return safeInteractionReply(interaction, {
                            content: 'Defina primeiro um canal de texto vÃ¡lido para a loja.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const permissions = channel.permissionsFor(client.user);
                    if (
                        !permissions ||
                        !permissions.has(PermissionFlagsBits.ViewChannel) ||
                        !permissions.has(PermissionFlagsBits.SendMessages) ||
                        !permissions.has(PermissionFlagsBits.EmbedLinks)
                    ) {
                        return safeInteractionReply(interaction, {
                            content: 'NÃ£o tenho permissÃ£o para publicar a loja nesse canal.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    try {
                        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                        let message = null;

                        if (loja.messageId) {
                            message = await channel.messages.fetch(loja.messageId).catch(() => null);
                        }

                        if (message) {
                            await message.edit(purchaseStorePanel(interaction.guild));
                        } else {
                            message = await channel.send(purchaseStorePanel(interaction.guild));
                            loja.messageId = message.id;
                            saveLojas();
                        }

                        return safeInteractionReply(interaction, {
                            content: `Loja publicada/atualizada em ${channel}.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error('Erro ao publicar loja:', error);
                        return safeInteractionReply(interaction, {
                            content: 'NÃ£o consegui publicar a loja. Confira as permissÃµes do canal.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                /* ===== MODERAÃ‡ÃƒO ===== */

                if (
                    [
                        'mod_ban',
                        'mod_kick',
                        'mod_timeout',
                        'mod_untimeout',
                        'mod_warn',
                        'mod_warns',
                        'mod_delwarn'
                    ].includes(
                        interaction.customId
                    )
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ VocÃª nÃ£o possui permissÃ£o para isso.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const type =
                        interaction.customId.replace(
                            'mod_',
                            ''
                        );

                    return interaction.showModal(
                        moderationModal(
                            type
                        )
                    );
                }

                if (
                    interaction.customId ===
                    'mod_lock'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await interaction.channel.permissionOverwrites.edit(
                        interaction.guild.roles.everyone,
                        {
                            SendMessages:
                                false
                        }
                    );

                    return safeInteractionReply(interaction, 
                        'ðŸ”’ Canal bloqueado.'
                    );
                }

                if (
                    interaction.customId ===
                    'mod_unlock'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await interaction.channel.permissionOverwrites.edit(
                        interaction.guild.roles.everyone,
                        {
                            SendMessages:
                                null
                        }
                    );

                    return safeInteractionReply(interaction, 
                        'ðŸ”“ Canal desbloqueado.'
                    );
                }

                if (
                    interaction.customId ===
                    'mod_slowmode'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    await interaction.channel.setRateLimitPerUser(
                        10
                    );

                    return safeInteractionReply(interaction, 
                        'ðŸ¢ Slowmode definido para 10 segundos.'
                    );
                }

                /* ===== TICKETS ===== */

                if (
                    interaction.customId ===
                    'ticket_set_channel'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                'modal_ticket_channel'
                            )
                            .setTitle(
                                'Definir canal de suporte'
                            );

                    const input =
                        new TextInputBuilder()
                            .setCustomId(
                                'channel_id'
                            )
                            .setLabel(
                                'ID do canal'
                            )
                            .setPlaceholder(
                                'Digite o ID do canal'
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            );

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            input
                        )
                    );

                    return interaction.showModal(
                        modal
                    );
                }

                if (
                    interaction.customId ===
                    'ticket_set_category'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                'modal_ticket_category'
                            )
                            .setTitle(
                                'Definir categoria'
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
                                'Digite o ID da categoria'
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            );

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            input
                        )
                    );

                    return interaction.showModal(
                        modal
                    );
                }

                if (
                    interaction.customId ===
                    'ticket_set_role'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                'modal_ticket_role'
                            )
                            .setTitle(
                                'Definir cargo ADM'
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
                                'Digite o ID do cargo'
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(
                                true
                            );

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            input
                        )
                    );

                    return interaction.showModal(
                        modal
                    );
                }

                if (
                    interaction.customId ===
                    'ticket_send_panel'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const cfg =
                        getConfig(
                            interaction.guild.id
                        );

                    if (
                        !cfg.ticketCanal
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Defina o canal do painel primeiro.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const channel =
                        interaction.guild.channels.cache.get(
                            cfg.ticketCanal
                        );

                    if (!channel) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'O canal configurado nÃ£o existe.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Eu nÃ£o tenho as permissÃµes necessÃ¡rias nesse canal.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await channel.send(
                        ticketOpenPanel()
                    );

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                'Painel de suporte enviado.',
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* ===== ABERTURA TICKETS ===== */

                if (
                    interaction.customId ===
                    'open_ticket_parceria'
                ) {
                    return openTicket(
                        interaction,
                        'parceria'
                    );
                }

                if (
                    interaction.customId ===
                    'open_ticket_duvida'
                ) {
                    return openTicket(
                        interaction,
                        'duvida'
                    );
                }

                if (
                    interaction.customId ===
                    'open_ticket_denuncia'
                ) {
                    return openTicket(
                        interaction,
                        'denuncia'
                    );
                }

                if (
                    interaction.customId ===
                    'open_ticket'
                ) {
                    return openTicket(
                        interaction,
                        'duvida'
                    );
                }

                /* ===== AÃ‡Ã•ES TICKETS ===== */

                if (
                    interaction.customId ===
                    'ticket_claim'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'VocÃª nÃ£o possui permissÃ£o para assumir este ticket.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    return safeInteractionReply(interaction, 
                        `${interaction.user} assumiu este ticket.`
                    );
                }

                if (
                    interaction.customId ===
                    'ticket_call_adm'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'VocÃª nÃ£o possui permissÃ£o para chamar a equipe.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const roleId =
                        getConfig(
                            interaction.guild.id
                        ).ticketCargo ||
                        ADM_ROLE_ID;

                    const role =
                        interaction.guild.roles.cache.get(
                            roleId
                        );

                    if (!role) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'O cargo ADM nÃ£o estÃ¡ configurado.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const members =
                        interaction.guild.members.cache
                            .filter(
                                member =>
                                    member.roles.cache.has(
                                        role.id
                                    )
                            )
                            .first(25);

                    if (
                        !members.length
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Nenhum ADM disponÃ­vel.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
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
                                members.map(
                                    member =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(
                                                member.user.username
                                            )
                                            .setValue(
                                                member.id
                                            )
                                )
                            );

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                'Escolha o ADM que deseja chamar.',
                            components: [
                                new ActionRowBuilder().addComponents(
                                    menu
                                )
                            ],
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                if (
                    interaction.customId ===
                    'ticket_close'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'VocÃª nÃ£o possui permissÃ£o para fechar este ticket.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await interaction.reply(
                        'Ticket serÃ¡ fechado em **5 segundos**...'
                    );

                    setTimeout(
                        async () => {
                            try {
                                await interaction.channel.delete();
                            } catch {}
                        },
                        5000
                    );

                    return;
                }

                /* ===== PROTEÃ‡ÃƒO ===== */

                if (
                    interaction.customId ===
                    'toggle_spam'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const cfg =
                        getConfig(
                            interaction.guild.id
                        );

                    cfg.antiSpam =
                        !cfg.antiSpam;

                    return interaction.update(
                        protectionPanel(
                            interaction.guild
                        )
                    );
                }

                if (
                    interaction.customId ===
                    'toggle_raid'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const cfg =
                        getConfig(
                            interaction.guild.id
                        );

                    cfg.antiRaid =
                        !cfg.antiRaid;

                    return interaction.update(
                        protectionPanel(
                            interaction.guild
                        )
                    );
                }

                /* ===== SORTEIOS ===== */

                if (
                    interaction.customId ===
                    'giveaway_create'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    return interaction.showModal(
                        giveawayCreateModal()
                    );
                }

                if (
                    interaction.customId ===
                    'giveaway_active'
                ) {
                    const active =
                        Object.values(
                            sorteios
                        ).filter(
                            giveaway =>
                                giveaway.guildId ===
                                    interaction.guild.id &&
                                giveaway.end >
                                    Date.now()
                        );

                    if (
                        !active.length
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'NÃ£o existem sorteios ativos.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                active
                                    .map(
                                        giveaway =>
                                            `ðŸŽ **${giveaway.prize}** â€” **${giveaway.winners} vencedor(es)** â€” <t:${Math.floor(giveaway.end / 1000)}:R>\n> Participantes: **${giveaway.participants?.length || 0}**`
                                    )
                                    .join(
                                        '\n\n'
                                    ),
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* ===== LISTA DE PARTICIPANTES ===== */

                if (interaction.customId.startsWith('giveaway_list_')) {
                    const parts = interaction.customId.split('_');
                    const action = parts[2];

                    if (action === 'prev' || action === 'next') {
                        const page = Number(parts[parts.length - 1]) || 0;
                        const giveawayId = parts.slice(3, -1).join('_');
                        const giveaway = sorteios[giveawayId];

                        if (!giveaway) {
                            return safeInteractionReply(interaction, {
                                content: 'âŒ Esse sorteio nÃ£o estÃ¡ mais disponÃ­vel.',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const nextPage = action === 'next' ? page + 1 : page - 1;
                        return interaction.update(
                            giveawayParticipantList(interaction.guild, giveaway, nextPage)
                        );
                    }

                    const giveawayId = interaction.customId.replace('giveaway_list_', '');
                    const giveaway = sorteios[giveawayId];

                    if (!giveaway) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Esse sorteio nÃ£o estÃ¡ mais disponÃ­vel.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    return safeInteractionReply(interaction, 
                        giveawayParticipantList(interaction.guild, giveaway, 0)
                    );
                }

                /* ===== GIRAR OUTRA PESSOA ===== */

                if (interaction.customId.startsWith('giveaway_reroll_')) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const giveawayId = interaction.customId.replace('giveaway_reroll_', '');
                    const giveaway = sorteios[giveawayId];

                    if (!giveaway) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Esse sorteio jÃ¡ foi resolvido.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    const winner = await rerollGiveaway(giveawayId);

                    if (winner) {
                        return interaction.editReply(`ðŸŽ‰ Novo vencedor: <@${winner}>`);
                    }

                    return interaction.editReply('ðŸŽ² O sorteio foi girado novamente. Confira a mensagem do sorteio.');
                }

                /* ===== PARTICIPAR ===== */

                if (
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
                        sorteios[
                            giveawayId
                        ];

                    if (!giveaway) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Esse sorteio nÃ£o estÃ¡ mais ativo.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    if (
                        giveaway.end <=
                        Date.now()
                    ) {
                        await finishGiveaway(
                            giveawayId
                        );

                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Esse sorteio jÃ¡ terminou.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    if (
                        !Array.isArray(
                            giveaway.participants
                        )
                    ) {
                        giveaway.participants =
                            [];
                    }

                    if (
                        giveaway.participants.includes(
                            interaction.user.id
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ VocÃª jÃ¡ estÃ¡ participando desse sorteio.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const member =
                        interaction.guild.members.cache.get(
                            interaction.user.id
                        );

                    const requirement =
                        await checkGiveawayRequirement(
                            member,
                            giveaway
                        );

                    if (
                        !requirement.ok
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    `âŒ ${requirement.reason}`,
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    giveaway.participants.push(
                        interaction.user.id
                    );

                    saveJSON(
                        'sorteios.json',
                        sorteios
                    );

                    try {
                        const message =
                            await interaction.channel.messages.fetch(
                                giveaway.messageId
                            );

                        await message.edit(
                            {
                                embeds: [
                                    giveawayMessage(
                                        giveaway
                                    )
                                ],
                                components: [
                                    giveawayButtons(
                                        giveawayId
                                    )
                                ]
                            }
                        );
                    } catch {}

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                'ðŸŽ VocÃª entrou no sorteio!',
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* ===== DIVERSÃƒO ===== */

                if (
                    interaction.customId ===
                    'fun_dice'
                ) {
                    const number =
                        Math.floor(
                            Math.random() *
                                6
                        ) + 1;

                    return safeInteractionReply(interaction, 
                        `ðŸŽ² VocÃª tirou **${number}**!`
                    );
                }

                if (
                    interaction.customId ===
                    'fun_coin'
                ) {
                    return safeInteractionReply(interaction, 
                        `ðŸª™ Deu **${randomItem(
                            [
                                'cara',
                                'coroa'
                            ]
                        )}**!`
                    );
                }

                if (
                    interaction.customId ===
                    'fun_8ball'
                ) {
                    return safeInteractionReply(interaction, 
                        `ðŸŽ± ${randomItem(
                            [
                                'Sim.',
                                'NÃ£o.',
                                'Talvez.',
                                'Com certeza.',
                                'Provavelmente.',
                                'NÃ£o conte com isso.'
                            ]
                        )}`
                    );
                }

                if (
                    interaction.customId ===
                    'fun_number'
                ) {
                    return safeInteractionReply(interaction, 
                        `ðŸ”¢ NÃºmero escolhido: **${Math.floor(
                            Math.random() *
                                100
                        ) + 1}**`
                    );
                }

                if (
                    interaction.customId ===
                    'fun_choose'
                ) {
                    return safeInteractionReply(interaction, 
                        {
                            content:
                                'ðŸƒ Use `/escolher` quando disponÃ­vel.',
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                if (
                    interaction.customId ===
                    'fun_quiz'
                ) {
                    return safeInteractionReply(interaction, 
                        `ðŸ† ${randomItem(
                            [
                                'VocÃª consegue!',
                                'Boa sorte!',
                                'Hora do desafio!',
                                'Mostre o que vocÃª sabe!'
                            ]
                        )}`
                    );
                }
            }

            /* ===== SELETOR DE CARGOS DA LOJA ===== */

            if (
                interaction.isRoleSelectMenu()
            ) {
                if (
                    interaction.customId === 'shop_select_price' ||
                    interaction.customId === 'shop_select_remove'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const role = interaction.roles.first();

                    if (!role || role.id === interaction.guild.id || role.managed) {
                        return safeInteractionReply(interaction, {
                            content: 'Esse cargo nÃ£o pode ser configurado para venda.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const loja = getLoja(interaction.guild.id);

                    if (interaction.customId === 'shop_select_remove') {
                        if (!loja.cargos[role.id]) {
                            return safeInteractionReply(interaction, {
                                content: 'Esse cargo nÃ£o estÃ¡ cadastrado na loja.',
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        delete loja.cargos[role.id];
                        saveLojas();

                        return safeInteractionReply(interaction, {
                            content: `O cargo **${role.name}** foi removido da loja.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(`modal_shop_price_${role.id}`)
                        .setTitle('Definir preÃ§o do cargo');

                    const input = new TextInputBuilder()
                        .setCustomId('price')
                        .setLabel('PreÃ§o em reais (ex: 9,90)')
                        .setPlaceholder('9,90')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(12);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(input)
                    );

                    return interaction.showModal(modal);
                }
            }

            /* ===== SELECT MENU ===== */

            if (
                interaction.isStringSelectMenu()
            ) {
                if (
                    interaction.customId === 'shop_customer_select'
                ) {
                    return openPurchaseTicket(
                        interaction,
                        interaction.values[0]
                    );
                }

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
                        return interaction.update(
                            {
                                content:
                                    'ADM nÃ£o encontrado.',
                                components:
                                    []
                            }
                        );
                    }

                    return interaction.update(
                        {
                            content:
                                `${member} foi chamado para este ticket!`,
                            components:
                                []
                        }
                    );
                }
            }

            /* ===== MODAIS ===== */

            if (
                interaction.isModalSubmit()
            ) {
                if (
                    interaction.customId === 'modal_shop_channel'
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const channelId = interaction.fields.getTextInputValue('channel_id').trim();
                    const channel = interaction.guild.channels.cache.get(channelId);

                    if (!channel || channel.type !== ChannelType.GuildText) {
                        return safeInteractionReply(interaction, {
                            content: 'Canal de texto invÃ¡lido. Confira o ID e tente novamente.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const permissions = channel.permissionsFor(client.user);
                    if (
                        !permissions ||
                        !permissions.has(PermissionFlagsBits.ViewChannel) ||
                        !permissions.has(PermissionFlagsBits.SendMessages) ||
                        !permissions.has(PermissionFlagsBits.EmbedLinks)
                    ) {
                        return safeInteractionReply(interaction, {
                            content: 'NÃ£o tenho permissÃ£o para enviar mensagens e embeds nesse canal.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const loja = getLoja(interaction.guild.id);
                    loja.canalId = channel.id;
                    // Se o canal mudou, a prÃ³xima publicaÃ§Ã£o criarÃ¡ a mensagem nesse novo canal.
                    loja.messageId = null;
                    saveLojas();

                    return safeInteractionReply(interaction, {
                        content: `Canal da loja definido como ${channel}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (
                    interaction.customId.startsWith('modal_shop_price_')
                ) {
                    if (!isStaff(interaction.member)) {
                        return safeInteractionReply(interaction, {
                            content: 'âŒ Sem permissÃ£o.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const roleId = interaction.customId.slice('modal_shop_price_'.length);
                    const role = interaction.guild.roles.cache.get(roleId);

                    if (!role || role.id === interaction.guild.id || role.managed) {
                        return safeInteractionReply(interaction, {
                            content: 'Esse cargo nÃ£o pode ser vendido.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const rawPrice = interaction.fields
                        .getTextInputValue('price')
                        .trim()
                        .replace(/R\$\s*/gi, '')
                        .replace(/\s/g, '')
                        .replace(',', '.');

                    if (!/^\d+(\.\d{1,2})?$/.test(rawPrice)) {
                        return safeInteractionReply(interaction, {
                            content: 'PreÃ§o invÃ¡lido. Use, por exemplo, 9,90 ou 10.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const price = Number(rawPrice);
                    if (!Number.isFinite(price) || price < 0) {
                        return safeInteractionReply(interaction, {
                            content: 'O preÃ§o precisa ser um nÃºmero vÃ¡lido maior ou igual a zero.',
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const loja = getLoja(interaction.guild.id);
                    loja.cargos[role.id] = { price };
                    saveLojas();

                    return safeInteractionReply(interaction, {
                        content: `Cargo **${role.name}** cadastrado por R$ ${price.toFixed(2).replace('.', ',')}.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                /* ===== MODERAÃ‡ÃƒO ===== */

                if (
                    [
                        'modal_ban',
                        'modal_kick',
                        'modal_timeout',
                        'modal_untimeout',
                        'modal_warn',
                        'modal_warns',
                        'modal_delwarn'
                    ].includes(
                        interaction.customId
                    )
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const userId =
                        interaction.fields.getTextInputValue(
                            'user_id'
                        );

                    const reason =
                        interaction.fields.fields.has(
                            'reason'
                        )
                            ? interaction.fields.getTextInputValue(
                                  'reason'
                              ) ||
                              'Nenhum motivo informado'
                            : 'Nenhum motivo informado';

                    const guild =
                        interaction.guild;

                    if (
                        interaction.customId ===
                        'modal_warn'
                    ) {
                        if (
                            !advertencias[
                                guild.id
                            ]
                        ) {
                            advertencias[
                                guild.id
                            ] = {};
                        }

                        if (
                            !advertencias[
                                guild.id
                            ][userId]
                        ) {
                            advertencias[
                                guild.id
                            ][userId] = [];
                        }

                        advertencias[
                            guild.id
                        ][userId].push({
                            reason,
                            moderator:
                                interaction
                                    .user
                                    .id,
                            timestamp:
                                Date.now()
                        });

                        saveJSON(
                            'advertencias.json',
                            advertencias
                        );

                        return safeInteractionReply(interaction, 
                            `âš ï¸ UsuÃ¡rio <@${userId}> recebeu uma advertÃªncia.`
                        );
                    }

                    if (
                        interaction.customId ===
                        'modal_warns'
                    ) {
                        const warns =
                            advertencias[
                                guild.id
                            ]?.[userId] ||
                            [];

                        if (
                            !warns.length
                        ) {
                            return safeInteractionReply(interaction, 
                                `ðŸ“‹ <@${userId}> nÃ£o possui advertÃªncias.`
                            );
                        }

                        return safeInteractionReply(interaction, 
                            `ðŸ“‹ <@${userId}> possui **${warns.length}** advertÃªncia(s).`
                        );
                    }

                    if (
                        interaction.customId ===
                        'modal_delwarn'
                    ) {
                        const warns =
                            advertencias[
                                guild.id
                            ]?.[userId] ||
                            [];

                        if (
                            !warns.length
                        ) {
                            return safeInteractionReply(interaction, 
                                `O usuÃ¡rio <@${userId}> nÃ£o possui advertÃªncias.`
                            );
                        }

                        warns.pop();

                        saveJSON(
                            'advertencias.json',
                            advertencias
                        );

                        return safeInteractionReply(interaction, 
                            `ðŸ—‘ï¸ A Ãºltima advertÃªncia de <@${userId}> foi removida.`
                        );
                    }

                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const member =
                        await guild.members
                            .fetch(userId)
                            .catch(
                                () => null
                            );

                    if (!member) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ UsuÃ¡rio nÃ£o encontrado no servidor.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    if (
                        interaction.customId ===
                        'modal_kick'
                    ) {
                        await member.kick(
                            reason
                        );

                        return safeInteractionReply(interaction, 
                            `ðŸ‘¢ ${member.user.tag} foi expulso.`
                        );
                    }

                    if (
                        interaction.customId ===
                        'modal_ban'
                    ) {
                        await member.ban(
                            {
                                reason
                            }
                        );

                        return safeInteractionReply(interaction, 
                            `ðŸ”¨ ${member.user.tag} foi banido.`
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
                            !Number.isFinite(
                                duration
                            ) ||
                            duration <= 0
                        ) {
                            return safeInteractionReply(interaction, 
                                {
                                    content:
                                        'âŒ DuraÃ§Ã£o invÃ¡lida.',
                                    flags: MessageFlags.Ephemeral
                                }
                            );
                        }

                        await member.timeout(
                            duration *
                                1000,
                            reason
                        );

                        return safeInteractionReply(interaction, 
                            `â±ï¸ ${member.user.tag} recebeu timeout por ${duration}s.`
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

                        return safeInteractionReply(interaction, 
                            `ðŸ”“ Timeout de ${member.user.tag} removido.`
                        );
                    }
                }

                /* ===== TICKET CANAL ===== */

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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Canal invÃ¡lido.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    getConfig(
                        interaction.guild.id
                    ).ticketCanal =
                        id;

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                `Canal de suporte definido como ${channel}.`,
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* ===== TICKET CATEGORIA ===== */

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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Categoria invÃ¡lida.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    getConfig(
                        interaction.guild.id
                    ).ticketCategoria =
                        id;

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                `Categoria definida como ${category}.`,
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* ===== TICKET CARGO ===== */

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
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'Cargo invÃ¡lido.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    getConfig(
                        interaction.guild.id
                    ).ticketCargo =
                        id;

                    return safeInteractionReply(interaction, 
                        {
                            content:
                                `Cargo ADM definido como ${role}.`,
                            flags: MessageFlags.Ephemeral
                        }
                    );
                }

                /* =========================
                   CRIAÃ‡ÃƒO DO SORTEIO
                ========================= */

                if (
                    interaction.customId ===
                    'modal_giveaway'
                ) {
                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Sem permissÃ£o.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const prize =
                        interaction.fields.getTextInputValue(
                            'prize'
                        ).trim();

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

                    const requirements =
                        interaction.fields.getTextInputValue(
                            'requirements'
                        )?.trim() ||
                        'Nenhum requisito';

                    if (
                        !prize
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ Informe um prÃªmio.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    if (
                        !Number.isFinite(
                            duration
                        ) ||
                        duration <= 0
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ A duraÃ§Ã£o precisa ser um nÃºmero maior que 0.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    if (
                        !Number.isInteger(
                            winners
                        ) ||
                        winners <= 0
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ A quantidade de vencedores precisa ser um nÃºmero inteiro maior que 0.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const parsed =
                        parseGiveawayRequirements(
                            requirements
                        );

                    if (
                        parsed.roleId &&
                        !interaction.guild.roles.cache.has(
                            parsed.roleId
                        )
                    ) {
                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ O cargo informado nos requisitos nÃ£o existe neste servidor.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }

                    const giveawayId =
                        `${interaction.guild.id}-${Date.now()}`;

                    const giveaway = {
                        id:
                            giveawayId,

                        guildId:
                            interaction.guild.id,

                        channelId:
                            interaction.channel.id,

                        prize,

                        winners,

                        requirements:
                            parsed.text,

                        requiredRole:
                            parsed.roleId,

                        minDays:
                            parsed.minDays,

                        minInvites:
                            parsed.minInvites,

                        end:
                            Date.now() +
                            duration *
                                60000,

                        participants:
                            [],

                        finished:
                            false,

                        messageId:
                            null
                    };

                    sorteios[
                        giveawayId
                    ] = giveaway;

                    saveJSON(
                        'sorteios.json',
                        sorteios
                    );

                    try {
                        const message =
                            await interaction.channel.send(
                                {
                                    embeds: [
                                        giveawayMessage(
                                            giveaway
                                        )
                                    ],

                                    components: [
                                        giveawayButtons(
                                            giveawayId
                                        )
                                    ]
                                }
                            );

                        giveaway.messageId =
                            message.id;

                        saveJSON(
                            'sorteios.json',
                            sorteios
                        );

                        scheduleGiveaway(
                            giveawayId
                        );

                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'ðŸŽ Sorteio criado com sucesso!',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    } catch (error) {
                        console.error(
                            'Erro ao criar sorteio:',
                            error
                        );

                        delete sorteios[
                            giveawayId
                        ];

                        saveJSON(
                            'sorteios.json',
                            sorteios
                        );

                        return safeInteractionReply(interaction, 
                            {
                                content:
                                    'âŒ NÃ£o consegui enviar o sorteio neste canal.',
                                flags: MessageFlags.Ephemeral
                            }
                        );
                    }
                }
            }
        } catch (error) {
            console.error(
                'Erro na interaÃ§Ã£o:',
                error
            );

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {
                try {
                    await interaction.reply(
                        {
                            content:
                                'âŒ Ocorreu um erro ao executar esta aÃ§Ã£o.',
                            flags: MessageFlags.Ephemeral
                        }
                    );
                } catch {}
            }
        }
    }
);

/* =========================
   ANTI-SPAM
========================= */

const spamTracker =
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

        if (!cfg.antiSpam) {
            return;
        }

        const key =
            `${message.guild.id}-${message.author.id}`;

        const now =
            Date.now();

        if (
            !spamTracker.has(key)
        ) {
            spamTracker.set(
                key,
                []
            );
        }

        const messages =
            spamTracker
                .get(key)
                .filter(
                    timestamp =>
                        now -
                            timestamp <
                        5000
                );

        messages.push(now);

        spamTracker.set(
            key,
            messages
        );

        if (
            messages.length >=
            6
        ) {
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
                        `ðŸ›¡ï¸ ${member} recebeu timeout por spam.`
                    );

                    spamTracker.delete(
                        key
                    );
                } catch {}
            }
        }
    }
);

/* =========================
   LOGIN
========================= */

client.login(TOKEN);
