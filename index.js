const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences, 
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const S1_GUILD = process.env.S1_GUILD_ID;
const S1_CHAT = process.env.S1_CHAT_ID;
const S2_GUILD = process.env.S2_GUILD_ID;
const S2_CHAT = process.env.S2_CHAT_ID;

let lastMessages = {
    quote: {},
    makan: {},
    sholat: {},
    tagVC: {}
};

// --- DATABASE PESAN ---

const dbQuotes = [
    "📢 Yuk, ramaikan Voice Channel! Ngobrol santai bareng yang lain di sini. ✨",
    "🔥 Room Voice lagi sepi nih, masuk yuk biar makin seru hari kita! 🥂",
    "💬 Daripada ngetik terus, mending Open Mic di VC. Lebih dapet feel-nya!",
    "🎵 Ada yang mau dengerin musik bareng di VC? Sini merapat!",
    "🌟 Kebersamaan itu mahal harganya, yuk luangkan waktu di Voice Channel sebentar."
];

const dbMakan = {
    pagi: ["🍳 Selamat pagi! Jangan lupa sarapan supaya tetap fokus berkegiatan ya! ✨"],
    siang: ["🍲 Sudah jam makan siang nih, istirahat sejenak dan jangan lupa makan ya semuanya!"],
    malam: ["🍝 Selamat malam! Waktunya makan malam dan santai sejenak setelah seharian sibuk."]
};

const dbSholat = "🕌 **Waktunya Sholat {nama}!** Mari kita tunaikan kewajiban terlebih dahulu. 🙏";

const dbTagVC = [
    "🥺 {user}, kok belum kelihatan di VC? Yuk gabung bareng kita!",
    "🧐 {user}, mumpung rame nih, ditungguin temen-temen di Voice Channel ya!",
    "📢 Panggilan untuk {user}, mampir ke VC bentar yuk..",
    "✨ {user}, harimu bakal lebih seru kalau gabung ngobrol di VC sekarang!"
];

// --- FUNGSI HELPER ---

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function nowWIB() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
}

async function smartSend(type, text) {
    const channelIds = [S1_CHAT, S2_CHAT].filter(id => id);
    for (const chId of channelIds) {
        try {
            const channel = await client.channels.fetch(chId).catch(() => null);
            if (!channel) continue;

            if (lastMessages[type][chId]) {
                const oldMsg = await channel.messages.fetch(lastMessages[type][chId]).catch(() => null);
                if (oldMsg) await oldMsg.delete().catch(() => null);
            }

            const newMsg = await channel.send(text);
            lastMessages[type][chId] = newMsg.id;
        } catch (e) {}
    }
}

async function checkInactivity() {
    const guilds = [S1_GUILD, S2_GUILD].filter(id => id);
    for (const guildId of guilds) {
        try {
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) continue;

            const members = await guild.members.fetch();
            const targets = members.filter(m => 
                !m.user.bot && 
                !m.voice.channelId && 
                m.presence?.status && m.presence?.status !== 'offline'
            );

            if (targets.size > 0) {
                const userTarget = targets.random();
                await smartSend('tagVC', pickRandom(dbTagVC).replace("{user}", userTarget.toString()));
            }
        } catch (e) {}
    }
}

// --- EVENT READY ---

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} Online!`);
    client.user.setActivity('Z3 Studios 🎧', { type: ActivityType.Watching });

    setInterval(() => smartSend('quote', pickRandom(dbQuotes)), 2 * 3600000);
    setInterval(() => checkInactivity(), 1 * 3600000);

    setInterval(async () => {
        const now = nowWIB();
        const h = now.getHours();
        const m = now.getMinutes();

        if (h === 7 && m === 30) await smartSend('makan', pickRandom(dbMakan.pagi));
        if (h === 12 && m === 30) await smartSend('makan', pickRandom(dbMakan.siang));
        if (h === 19 && m === 0) await smartSend('makan', pickRandom(dbMakan.malam));

        const jadwalSholat = { 
            "Subuh": [4, 40], "Dzuhur": [12, 0], "Ashar": [15, 20], "Maghrib": [18, 5], "Isya": [19, 15] 
        };

        for (const [nama, waktu] of Object.entries(jadwalSholat)) {
            if (h === waktu[0] && m === waktu[1]) {
                await smartSend('sholat', dbSholat.replace("{nama}", nama));
            }
        }
    }, 60000);
});

// --- COMMANDS (FIXED DOUBLE RESPONSE) ---

client.on('messageCreate', async (msg) => {
    // Abaikan jika bot atau bukan di guild
    if (msg.author.bot || !msg.guild) return;

    if (msg.content === '!join') {
        const voiceChannel = msg.member.voice.channel;
        if (voiceChannel) {
            // Cek apakah sudah ada koneksi di guild ini
            const existingConnection = getVoiceConnection(msg.guild.id);
            if (existingConnection) {
                return msg.reply('Aku sudah ada di dalam VC kok! 😉');
            }

            try {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: true
                });
                // Gunakan return agar berhenti di sini
                return msg.channel.send(`✅ Siap! Aku sudah stand-by di VC **${voiceChannel.name}** ya.`);
            } catch (err) {
                return msg.reply('❌ Gagal masuk VC.');
            }
        } else {
            return msg.reply('Masuk VC dulu Bos!');
        }
    }

    if (msg.content === '!leave') {
        const connection = getVoiceConnection(msg.guild.id);
        if (connection) {
            connection.destroy();
            return msg.channel.send('👋 Pamit dulu, jangan lupa panggil lagi ya!');
        }
    }
});

client.login(TOKEN);
