const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Railway bakal ambil Token dari menu 'Variables'
const TOKEN = process.env.DISCORD_TOKEN; 

client.once('ready', () => {
    console.log(`✅ Bot Z3 Studios Aktif: ${client.user.tag}`);
    client.user.setActivity('Z3 Studios Night', { type: 3 }); // Status bot (Watching)
});

client.on('messageCreate', async (message) => {
    // Ketik !join di chat biar bot masuk ke VC kamu
    if (message.content === '!join') {
        const channel = message.member.voice.channel;
        
        if (channel) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false, // Biar kelihatan dengerin
                selfMute: true,  // Botnya diem (nggak berisik)
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                message.reply(`Siap, Bos! Saya sudah nongkrong di **${channel.name}**.`);
            });
        } else {
            message.reply("Masuk ke Voice Channel dulu! Bozz");
        }
    }

    // Perintah tambahan buat keluar
    if (message.content === '!leave') {
        const { getVoiceConnection } = require('@discordjs/voice');
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply("👋 Cabut dulu ya!");
        }
    }
});

client.login(TOKEN);
