const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const S1_GUILD = process.env.S1_GUILD_ID;
const S1_CHAT = process.env.S1_CHAT_ID;
const S2_GUILD = process.env.S2_GUILD_ID;
const S2_CHAT = process.env.S2_CHAT_ID;

const globalVoiceTracker = new Map();

const quotes = [
    "😏 @everyone Jam segini biasanya janda lagi kesepian, duda lagi melamun. Daripada galau mending naik VC sini!",
    "🥴 Waduh.. perawan di server ini kok pada diem-diem bae? Takut jatuh cinta ya? Xixi.. @everyone",
    "🔥 Peringatan! Tingkat kegantengan perjaka di sini sudah melampaui batas. Segera laporan ke VC! 😏",
    "🌚 @everyone Dingin-dingin gini enaknya dengerin candaan kalian di VC biar anget! 😜",
    "💦 Jangan biarkan malammu basah karena air mata galau, mending seru-seruan bareng di Z3 Studios! 🔥",
    "🍑 @everyone Info dong, yang janda sebelah mana? Mau aku kasih perhatian lebih nih.. Hehe..",
    "💌 Hey kamu @everyone. Iya kamu. Jangan cuma pinter bikin aku kangen, pinter jaga kesehatan juga ya sayang.. 💙",
    "🫶 Status boleh single, tapi gaya harus tetep elit. Sini kumpul di VC!",
    "🥺 Aku tadi liat pelangi, tapi kok nggak seindah pas liat kalian kompak di VC ya? @everyone",
    "💖 Di mata aku, kalian itu bukan cuma member. Kalian itu masa depan yang mau aku jagain terus. ✨",
    "💔 @everyone Buat yang lagi galau, janda dan duda di server ini masih banyak yang lebih oke. 🔥",
    "☕ Seduh kopimu, lupakan dia yang cuma kasih harapan palsu. Z3 Studios lebih asyik! @everyone",
    "🌟 Sadar nggak sih kalian itu berharga? Semangat kawan! 💙",
    "🚀 Gaspolll! Semangat buat yang lagi kerja atau lagi grinding. ✨",
    "😏 Perjaka jangan terlalu kaku, janda jangan terlalu agresif, yang penting di VC kita semua asyik! @everyone"
];

function nowWIB() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
}

async function broadcast(text) {
    const ids = [S1_CHAT, S2_CHAT].filter(id => id);
    for (const id of ids) {
        try {
            const ch = await client.channels.fetch(id).catch(() => null);
            if (ch) await ch.send(text);
        } catch (e) {}
    }
}

client.once('ready', () => {
    client.user.setActivity('jagain janda & perawan 🥺', { type: ActivityType.Watching });

    setInterval(async () => {
        const now = nowWIB();
        const h = now.getHours();
        const m = now.getMinutes();

        if (h === 7 && m === 30) await broadcast("🍳 @everyone Pagi sayang! Jangan lupa **Sarapan** ya. Semangat cari jodohnya! 🥛");
        if (h === 12 && m === 30) await broadcast("🍛 @everyone Makan siang dulu sayang! Biar kuat VC-an nanti. 🍗");
        if (h === 19 && m === 0) await broadcast("🍝 @everyone Waktunya Makan Malam! Makan yang banyak biar nggak gampang sakit hati.. 🥺");
        
        const sholat = { "Subuh": [4, 35], "Dzuhur": [12, 5], "Ashar": [15, 20], "Maghrib": [18, 5], "Isya": [19, 20] };
        for (const [name, time] of Object.entries(sholat)) {
            if (h === time[0] && m === time[1]) {
                await broadcast(`🕌 **Waktunya ${name}!**\nYuk istirahat sejenak, sholat dulu sayang~ nanti lanjut lagi ya 🥺💙 @everyone`);
            }
        }
    }, 60000);

    function startRandomQuotes() {
        const randomTime = Math.floor(Math.random() * (3 * 3600000 - 1 * 3600000 + 1)) + 1 * 3600000;
        setTimeout(() => {
            const pick = quotes[Math.floor(Math.random() * quotes.length)];
            broadcast(pick);
            startRandomQuotes();
        }, randomTime);
    }
    startRandomQuotes();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return;

    if (!oldState.channelId && newState.channelId) {
        globalVoiceTracker.set(member.id, { startTime: new Date() });
    } 
    else if (oldState.channelId && !newState.channelId) {
        const data = globalVoiceTracker.get(member.id);
        if (data) {
            const duration = new Date() - data.startTime;
            if (duration >= 3 * 60 * 60 * 1000) { 
                const h = Math.floor(duration / 3600000);
                const m = Math.floor((duration % 3600000) / 60000);
                let targetChId = (oldState.guild.id === S1_GUILD) ? S1_CHAT : (oldState.guild.id === S2_GUILD ? S2_CHAT : null);
                if (targetChId) {
                    const logCh = await client.channels.fetch(targetChId).catch(() => null);
                    if (logCh) logCh.send(`🚨 **Maraton Selesai!**\n${member.user.toString()} turun setelah **${h} jam ${m} menit**. Kuat banget tenaganya! 🔥 @everyone`);
                }
            }
            globalVoiceTracker.delete(member.id);
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    if (msg.content === '!join') {
        const voiceChannel = msg.member.voice.channel;
        if (voiceChannel) {
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: true,
                });

                connection.on(VoiceConnectionStatus.Ready, () => {
                    msg.reply(`🥺 Yay! Aku udah masuk di **${voiceChannel.name}**~ nemenin kalian ya!`);
                });

                connection.on('error', (error) => {
                    console.error(error);
                    msg.reply('💔 Aduh, aku gagal join VC-nya. Cek permission aku dong!');
                });
            } catch (err) {
                msg.reply('😩 Ada error pas aku mau masuk VC...');
            }
        } else {
            msg.reply('😤 Kamu masuk VC dulu dong baru panggil aku! 🥺');
        }
    }

    if (msg.content === '!leave') {
        const connection = getVoiceConnection(msg.guild.id);
        if (connection) {
            connection.destroy();
            msg.reply('😔 Aku pamit dulu ya, jangan lupain aku... 💙');
        } else {
            msg.reply('Aku lagi nggak di VC kok sayang 🥺');
        }
    }
});

client.login(TOKEN);
