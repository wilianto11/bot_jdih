import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

// Token bot Telegram
const token = "6817249032:AAHV4ykkKV_LBtDB0zcqE8uqHsXeHuf25Uw";
const bot = new TelegramBot(token, { polling: true });

// URL API JSON
const apiUrl = "https://jdih.bekasikab.go.id/integrasi.php";

// Fungsi untuk mengambil data dari API
async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// Fungsi untuk mencocokkan input dengan data
function matchData(noPeraturan, tahun, data) {
  return data.filter(
    (item) =>
      (item.noPeraturan === noPeraturan || noPeraturan === "") &&
      item.tahun_pengundangan === tahun
  );
}

// Mendengarkan perintah /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Selamat datang! Silakan masukkan nomor peraturan dan tahun (misalnya: 1 2023):\n\nKetik /help untuk bantuan."
  );
});

// Mendengarkan perintah /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Saya adalah bot yang dapat membantu Anda mencari data peraturan dari JDIH Kabupaten Bekasi. Berikut cara penggunaannya:

1. Kirimkan nomor peraturan dan tahun dalam format berikut: "nomor_peraturan tahun" (misalnya: 1 2023).
2. Saya akan mengirimkan detail peraturan yang sesuai dengan input Anda.

Contoh input:
- Untuk mencari peraturan nomor 1 tahun 2023, kirimkan: 1 2023.

Jika Anda mengalami masalah atau membutuhkan bantuan lebih lanjut, kirimkan pesan ke /start untuk memulai lagi.`
  );
});

// Menangani input dari pengguna
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Abaikan pesan yang dikirim oleh bot itu sendiri
  if (msg.from.is_bot) return;

  try {
    // Mengabaikan pesan yang bukan perintah
    if (msg.text.startsWith("/")) return;

    const [noPeraturan, tahun] = msg.text.split(" ");

    // Validasi input
    if (!noPeraturan || !tahun) {
      return bot.sendMessage(
        chatId,
        "Format input salah. Silakan masukkan nomor peraturan dan tahun dalam format yang benar (misalnya: 1 2023)."
      );
    }

    // Kirim pesan loading
    const loadingMessage = await bot.sendMessage(
      chatId,
      "Mengambil data, mohon tunggu..."
    );

    const data = await fetchData();
    const results = matchData(noPeraturan, tahun, data);

    if (results.length > 0) {
      results.forEach((result) => {
        const responseMessage = `
          Judul: ${result.judul}
          Tahun Pengundangan: ${result.tahun_pengundangan}
          Jenis: ${result.jenis}
          Nomor Peraturan: ${result.noPeraturan}
          Tanggal Pengundangan: ${result.tanggal_pengundangan || "Tidak ada"}
          Status: ${result.status}
          URL Detail Peraturan: ${result.urlDetailPeraturan}
          URL Download: ${result.urlDownload}
        `;

        bot.sendMessage(chatId, responseMessage);
      });
    } else {
      bot.sendMessage(
        chatId,
        "Data tidak ditemukan untuk input tersebut || Belum di Publish."
      );
    }

    // Hapus pesan loading
    bot.deleteMessage(chatId, loadingMessage.message_id);
  } catch (error) {
    console.error("Error fetching data:", error);
    bot.sendMessage(chatId, "Terjadi kesalahan saat mengambil data.");
  }
});
