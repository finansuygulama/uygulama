# Finansiyet (Finance/Diary App)

## What This Is
Kullanıcının Obsidian benzeri bir günlük tutarak kendi gelir ve giderlerini kaydettiği, gizliliğe önem veren yerel (offline) odaklı bir kişisel finans mobil uygulamasıdır. Kullanıcı sadece günlüğünü tutar, uygulama arkaplanda belirli hashtagleri algılayıp finansal bir özete çevirir.

## Core Value
Kullanıcıların harcama takibi yaparken bunu angarya bir form doldurma gibi değil, kendi dijital günlüklerinin doğal bir uzantısı olarak hissetmelerini sağlamak. Tüm verilerin yerel cihazda gizli kalması garanti altındadır.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] React Native / Expo altyapısında mobil uygulamanın kurulması.
- [ ] Obsidian-benzeri sade metin düzenleyicisinin ve günlük kaydetme mantığının geliştirilmesi.
- [ ] Giderlerin ve gelirlerin tespit edilmesi için katı metin ayrıştırma formatının (Örn: `#gider 150 Market`) uygulanması.
- [ ] Ayrıştırılan metinlerin ve işlemlerin yerel SQLite veritabanına (örn: WatermelonDB veya Expo SQLite) kaydedilmesi.
- [ ] Ay, hafta veya gün bazında harcamaların/gelirlerin özet olarak listelendiği Finansal Özet (Dashboard) ekranı.
- [ ] (Daha sonra - Faz 2) Google Drive veya iCloud yedeklemesinin isteğe bağlı bir eklenti olarak geliştirilmesi.

### Out of Scope

- [Bulut Senkronizasyonu ve SaaS Veritabanı] — Projenin tam gizlilik odaklı olması hedeflendiğinden, merkezi bir bulutta verilerin tutulması reddedilmiştir.
- [Esnek veya Yapay Zeka Tabanlı Ayrıştırma] — Sadece kurallı kelimelere göre çalışan (regex) güvenilir bir ayrıştırıcı kullanılacaktır. Karmaşık algoritmalar performansı düşüreceği için yapılmayacaktır.

## Context
Kullanıcı finansal harcamalarını geleneksel cüzdan/finans uygulamaları yerine, not tutma/journal mantığını kullanarak değerlendirmek istiyor. Bu bağlamda metin alanının rahat ve kullanılabilir olması kritik.
Dizayn mimarisinde şık, karanlık temaya uygun modern bir arayüz düşünülmelidir. Ayrıca projenin global kodlama standardı olarak her zaman "sihirli numara/kelime" kullanımından kaçınılmalı; roller, kategoriler vs. kod içerisinde `Enum` / `Sabit` tanımlarıyla yönetilmelidir.

## Constraints
- **Gizlilik:** Veriler cihazdan çıkamaz (telemetri bile gönderilmemelidir).
- **Platform:** Mobil App (iOS ve Android çıkışına uyumlu Expo).
- **Kod Kalitesi:** Temiz kod, Magic number içermeyen sıkı statik kurallar kullanılmalıdır.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite Yerel Veritabanı seçimi | Salt Markdown dosyalarını aramaktansa çok daha performanslı mobil sorgulamalar ve anlık grafik render işlemleri yapmak adına | — Pending |
| Katı Regex Kural Ayrıştırıcı (Hashtag) | İşlem güvenilirliğini (istatistik yanılma payı) tamamen %100'e taşımak ve telefon pil tüketimini / kod karmaşıklığını minimal tutmak için | — Pending |

---
*Last updated: 2026-04-07 after initialization*
