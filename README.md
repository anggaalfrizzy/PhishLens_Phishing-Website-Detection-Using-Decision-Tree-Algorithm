# Phishlens

Aplikasi web untuk memeriksa apakah sebuah situs berpotensi phishing, memakai model **Decision Tree** (scikit-learn) yang bisa dijelaskan. Dibuat untuk Tugas Akhir 05, Pembelajaran Mesin.

- Data: [Phishing Websites, UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/327) (Mohammad dan McCluskey, 2012), CC BY 4.0
- Sampel yang dipakai: 1.500 baris (750 phishing, 750 sah), diambil acak dari 5.849 baris unik
- Target `Result`: `-1` = phishing, `1` = sah

## Isi proyek

```
app.py              Flask: halaman, API /api/predict, /health
features.py         8 pertanyaan formulir (label dua bahasa)
train.py            Melatih Model A dan Model B, menyimpan model dan metrik
data/               Dataset 1.500 baris
models/             model.joblib (Model B) dan metrics.json
reports/            Gambar pohon keputusan Model B untuk laporan
templates/ static/  Tampilan web (HTML, CSS, JS)
Procfile            Perintah start untuk Railway
```

## Jalankan di komputer

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                    # buka http://localhost:5000
```

Melatih ulang model (opsional, hasilnya menimpa `models/`):

```bash
pip install -r requirements-dev.txt
python train.py
```

## Deploy ke Railway

1. Unggah folder ini ke repositori GitHub baru (`git init`, `git add .`, `git commit`, `git push`).
2. Di Railway: **New Project**, lalu **Deploy from GitHub repo**, pilih repositori itu.
3. Buka **Settings**, **Networking**, tekan **Generate Domain**.
4. Tunggu build selesai. Cek `https://domain-kamu/health`, harus menjawab `{"status":"ok"}`.

Opsional: di tab **Variables** tambahkan `APP_AUTHOR` berisi nama dan NIM kamu. Isinya tampil di footer.

## Pemetaan ke TA-05

| Syarat | Lokasi |
|---|---|
| Model A (tanpa batas) dan Model B (pruned) | `train.py`, perbandingannya tampil di bagian "Cara model bekerja" |
| Visualisasi pohon Model B | `reports/tree_model_b.png` |
| Feature importance | Bagian "Ciri yang paling menentukan" dan `models/metrics.json` |
| Simpan model dengan Joblib | `models/model.joblib` |
| Aplikasi Flask dengan formulir input | `app.py`, `templates/index.html` |

## Catatan teknis

- Formulir menampilkan 8 dari 30 fitur, yaitu yang paling berpengaruh pada Model B. Sisanya diisi modus data latih (`defaults` di `model.joblib`).
- Keyakinan model adalah proporsi data latih pada daun pohon, bukan probabilitas terkalibrasi.
- Jika `model.joblib` tidak cocok dengan versi scikit-learn di server, aplikasi otomatis melatih ulang saat start.

## API

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"values":{"SSLfinal_State":-1,"URL_of_Anchor":-1,"Links_in_tags":-1,"web_traffic":-1,"Prefix_Suffix":-1,"having_Sub_Domain":-1,"Request_URL":-1,"HTTPS_token":-1}}'
```
