"""Pertanyaan di formulir. Nilai -1 / 0 / 1 mengikuti kode asli dataset UCI Phishing Websites.

Delapan fitur ini dipilih dari feature importance Model B (urut dari yang paling berpengaruh).
Fitur lain memakai nilai paling sering (modus) dari data latih.
"""

FORM_FEATURES = [
    {
        "id": "SSLfinal_State",
        "short": {"id": "Status HTTPS", "en": "HTTPS status"},
        "q": {"id": "Apakah situs memakai HTTPS?", "en": "Does the site use HTTPS?"},
        "hint": {"id": "Cari ikon gembok di sebelah alamat situs.", "en": "Look for the padlock next to the address."},
        "options": [
            {"v": 1, "id": "Ya, sertifikat tepercaya", "en": "Yes, trusted certificate"},
            {"v": 0, "id": "Ya, penerbit meragukan", "en": "Yes, doubtful issuer"},
            {"v": -1, "id": "Tidak memakai HTTPS", "en": "No HTTPS"},
        ],
    },
    {
        "id": "URL_of_Anchor",
        "short": {"id": "Tujuan tautan", "en": "Link destinations"},
        "q": {"id": "Ke mana tautan di halaman mengarah?", "en": "Where do the page's links point?"},
        "hint": {"id": "Arahkan kursor ke tautan, lalu lihat alamat tujuannya di pojok browser.", "en": "Hover a link and read its destination in the browser corner."},
        "options": [
            {"v": 1, "id": "Hampir semua ke situs sendiri", "en": "Mostly to the site itself"},
            {"v": 0, "id": "Sebagian ke situs lain", "en": "Some to other sites"},
            {"v": -1, "id": "Kebanyakan ke situs lain atau kosong", "en": "Mostly elsewhere or empty"},
        ],
    },
    {
        "id": "Links_in_tags",
        "short": {"id": "Skrip dan gaya dari luar", "en": "External scripts and styles"},
        "q": {"id": "Seberapa banyak skrip dan gaya halaman dimuat dari luar?", "en": "How much script and style code loads from elsewhere?"},
        "hint": {"id": "Buka tab Network atau Page source di browser.", "en": "Open the Network tab or Page source in your browser."},
        "options": [
            {"v": 1, "id": "Sedikit", "en": "Little"},
            {"v": 0, "id": "Sedang", "en": "Some"},
            {"v": -1, "id": "Banyak", "en": "A lot"},
        ],
    },
    {
        "id": "web_traffic",
        "short": {"id": "Keramaian situs", "en": "Site traffic"},
        "q": {"id": "Seberapa ramai situs ini?", "en": "How busy is the site?"},
        "hint": {"id": "Cek peringkatnya di alat seperti Similarweb.", "en": "Check its rank on a tool such as Similarweb."},
        "options": [
            {"v": 1, "id": "Sangat ramai", "en": "Very busy"},
            {"v": 0, "id": "Cukup ramai", "en": "Moderately busy"},
            {"v": -1, "id": "Sepi atau tidak terdata", "en": "Quiet or unlisted"},
        ],
    },
    {
        "id": "Prefix_Suffix",
        "short": {"id": "Tanda hubung di domain", "en": "Hyphen in domain"},
        "q": {"id": "Apakah nama domain memakai tanda hubung (-)?", "en": "Does the domain name contain a hyphen (-)?"},
        "hint": {"id": "Situs palsu sering meniru nama asli, misalnya bank-login.com.", "en": "Fake sites often imitate real names, such as bank-login.com."},
        "options": [
            {"v": 1, "id": "Tidak", "en": "No"},
            {"v": -1, "id": "Ya", "en": "Yes"},
        ],
    },
    {
        "id": "having_Sub_Domain",
        "short": {"id": "Jumlah subdomain", "en": "Subdomain count"},
        "q": {"id": "Berapa banyak subdomain di alamat situs?", "en": "How many subdomains does the address have?"},
        "hint": {"id": "Subdomain adalah bagian di depan nama utama, seperti blog.situs.com. Abaikan www.", "en": "A subdomain sits before the main name, like blog.site.com. Ignore www."},
        "options": [
            {"v": 1, "id": "Satu atau tidak ada", "en": "One or none"},
            {"v": 0, "id": "Dua", "en": "Two"},
            {"v": -1, "id": "Tiga atau lebih", "en": "Three or more"},
        ],
    },
    {
        "id": "Request_URL",
        "short": {"id": "Sumber gambar dan konten", "en": "Image and content source"},
        "q": {"id": "Dari mana gambar dan konten halaman dimuat?", "en": "Where do the page's images and content load from?"},
        "hint": {"id": "Bisa dicek lewat Inspect element di browser.", "en": "You can check this with Inspect element in your browser."},
        "options": [
            {"v": 1, "id": "Kebanyakan dari situs sendiri", "en": "Mostly from the site itself"},
            {"v": 0, "id": "Sebagian dari luar", "en": "Partly from outside"},
            {"v": -1, "id": "Kebanyakan dari luar", "en": "Mostly from outside"},
        ],
    },
    {
        "id": "HTTPS_token",
        "short": {"id": "Kata https di domain", "en": "“https” in domain"},
        "q": {"id": "Apakah kata “https” muncul di nama domain?", "en": "Does the word “https” appear in the domain name?"},
        "hint": {"id": "Penipu menaruhnya agar terlihat aman, misalnya https-bank.com.", "en": "Scammers add it to look safe, such as https-bank.com."},
        "options": [
            {"v": 1, "id": "Tidak", "en": "No"},
            {"v": -1, "id": "Ya", "en": "Yes"},
        ],
    },
]

PRESETS = {
    "phishing": {f["id"]: -1 for f in FORM_FEATURES},
    "legitimate": {f["id"]: 1 for f in FORM_FEATURES},
}
