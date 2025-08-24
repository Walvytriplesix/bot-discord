require('dotenv').config();
const fetch = require('node-fetch'); // node-fetch v3
const express = require('express');
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// ====== Client Setup ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ====== Prefix & Filters ======
const prefix = '?';

const kataKasar = [
  'anjing','bangsat','kontol','memek','goblok','yatim','piatu','bajingan','tolol','kampret','setan',
  'fuck','fck','f@ck','f.u.c.k','fuk','fucking','fuq','fu*k','fu**',
  'shit','sh1t','sh!t','sh*t',
  'bitch','b1tch','b!tch','biatch','b*tch',
  'dick','d1ck','d!ck','suckmydick','suck_my_dick',
  'asshole','ashole','a55hole',
  'nigga','nigger','ni**a','n1gga','ni99a',
  'cunt','pussy','p@ssy','p*ssy','cum','jizz',
  'retard','idiot','moron','stupid','dumbass','dumb','kill yourself','kys',
  'die bitch','die in hell','go to hell', "png",'kill urself'
];

const kataPromosi = [
  'jual murah','jual akun','beli akun','jual script','murah meriah','diskon besar','order',
  'buy','sell','cheap','wts','wtb','wtf','wtc','wtp','wtl',
  'join discord','discord.gg/','dsc.gg','invite.gg',
  'roblox.com/games/','roblox.com/share','roblox.com/privateserver',
  'https://discord.gg','http://discord.gg','https://www.roblox.com/','roblox.gg/'
];

const userWarnings = new Map();

function checkFilter(content, list) {
  return list.some(kata => content.toLowerCase().includes(kata));
}

// ====== Bot Ready ======
client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
  client.user.setActivity('Walvy Community', { type: 3 });

  // ====== Keep-Alive Ping ======
  const keepAliveUrl = process.env.KEEP_ALIVE_URL;
  if (keepAliveUrl) {
    setInterval(() => {
      fetch(keepAliveUrl)
        .then(() => console.log('Pinged keep-alive URL'))
        .catch(err => console.log('Failed to ping keep-alive:', err));
    }, 4 * 60 * 1000); // setiap 4 menit
  }
});

// ====== Message Filter & Commands ======
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);

  // === Bad Words ===
  if (checkFilter(message.content, kataKasar) && !isAdmin) {
    await message.delete();
    const userId = message.author.id;
    const warnCount = (userWarnings.get(userId) || 0) + 1;
    userWarnings.set(userId, warnCount);
    return message.channel.send(`${message.author}, don't use bad words! Warning ${warnCount}/5`);
  }

  // === Promotion / Links ===
  if (checkFilter(message.content, kataPromosi) && !isAdmin) {
    await message.delete();
    return message.channel.send(`${message.author}, promotions / Discord links / private servers are not allowed here.`);
  }

  // === Commands ===
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'say') {
    const content = message.content.slice(prefix.length + cmd.length).trim();
    const [mentionPart, ...messagePart] = content.split('-');
    const channel = message.mentions.channels.first();
    const msg = messagePart.join('-').trim();
    if (!channel || !msg) return message.reply('Wrong format!\nExample: `?say #general - Hello everyone`');

    const embed = new EmbedBuilder()
      .setDescription(msg)
      .setColor(0xff0000)
      .setTimestamp();

    channel.send({ embeds: [embed] });
    return message.reply(`Announcement has been sent to ${channel}`);
  }

  if (cmd === 'sayclipboard') {
    const content = message.content.slice(prefix.length + cmd.length).trim();
    const [mentionPart, ...messagePart] = content.split('-');
    const channel = message.mentions.channels.first();
    const msg = messagePart.join('-').trim();
    if (!channel || !msg) return message.reply('Wrong format!\nExample: `?sayclipboard #general - Copy this text`');

    const embed = new EmbedBuilder()
      .setDescription(msg)
      .setColor(0x00aeff)
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('copy_clipboard')
          .setLabel('📋 Copy Text')
          .setStyle(ButtonStyle.Primary)
      );

    await channel.send({ embeds: [embed], components: [row] });
    return message.reply(`Announcement + copy button has been sent to ${channel}`);
  }

  // === Clear Messages ===
  const bulkDelete = async (limit) => {
    const fetched = await message.channel.messages.fetch({ limit });
    await message.channel.bulkDelete(fetched, true);
  };

  if (cmd.startsWith('cc')) {
    if (!isAdmin) return message.reply('Only admins can use this command.');
    if (cmd === 'cc1') await bulkDelete(1);
    if (cmd === 'cc2') await bulkDelete(2);
    if (cmd === 'ccall') await bulkDelete(100);
    return message.channel.send(`✅ Messages deleted.`).then(msg => setTimeout(() => msg.delete(), 3000));
  }
});

// ====== Button Interaction ======
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'copy_clipboard') {
    const embed = interaction.message.embeds[0];
    if (!embed) return interaction.reply({ content: 'No text found!', ephemeral: true });
    await interaction.reply({
      content: `Copy this text:\n\`\`\`${embed.description}\`\`\``,
      ephemeral: true
    });
  }
});

// ====== Express Keep-Alive Server ======
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Web server running on port ${port}`));

// ====== Login ======
client.login(process.env.DISCORD_TOKEN);
