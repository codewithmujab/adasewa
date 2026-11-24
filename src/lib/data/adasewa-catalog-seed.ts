import type { RentalItemSpec } from '#lib/server/db/schema';

export interface SeedCategoryDef {
	slug: string;
	name: string;
	description: string;
	icon: string;
	accent: string;
	sortOrder: number;
}

export interface SeedItemDef {
	categorySlug: string;
	name: string;
	slug: string;
	shortDescription: string;
	description: string;
	specs: RentalItemSpec[];
	includes: string[];
	variants: string[];
	pricePerDay: number;
	unitLabel: string;
	minDurationDays: number;
	stockQty: number;
	requiresDeposit: boolean;
	isFeatured: boolean;
	sortOrder: number;
}

export const ADASEWA_CATEGORIES: SeedCategoryDef[] = [
	{
		slug: 'proyektor-display',
		name: 'Proyektor & Display',
		description:
			'Proyektor 2.600–10.000 lumens, screen tripod/giant, TV LED 32"–85", videotron, kabel HDMI/VGA, hingga akun Zoom Pro.',
		icon: 'projector',
		accent: 'indigo',
		sortOrder: 1
	},
	{
		slug: 'audio-sound-system',
		name: 'Audio & Sound System',
		description:
			'Paket sound system 1.000W–20.000W, speaker portable, mixer 16 channel, mic wireless/kabel, megaphone, hingga handy talkie.',
		icon: 'audio',
		accent: 'emerald',
		sortOrder: 2
	},
	{
		slug: 'kamera-streaming-booth',
		name: 'Kamera, Streaming & Booth',
		description:
			'Kamera mirrorless & DSLR, camcorder, GoPro, drone, paket live streaming 2–5 kamera, photobooth, mirror booth & video 360.',
		icon: 'camera',
		accent: 'amber',
		sortOrder: 3
	},
	{
		slug: 'gadget-laptop-gaming',
		name: 'Gadget, Laptop & Gaming',
		description:
			'iPhone 12–17 Pro Max, laptop gaming/editing ASUS ROG, konsol PlayStation 3/4/5, serta mesin fotokopi Canon.',
		icon: 'gadget',
		accent: 'sky',
		sortOrder: 4
	},
	{
		slug: 'event-lighting-panggung',
		name: 'Event, Lighting & Genset',
		description:
			'Lighting panggung profesional, panggung 6×10m, genset 10–20 kVA, AC portable, misty fan, kursi futura, hingga perlengkapan catering.',
		icon: 'event',
		accent: 'rose',
		sortOrder: 5
	},
	{
		slug: 'alat-musik',
		name: 'Alat Musik',
		description:
			'Perlengkapan band & panggung lengkap: alat DJ, gitar akustik/listrik, bass, drum elektrik, biola, cajon, saxophone & ampli.',
		icon: 'music',
		accent: 'violet',
		sortOrder: 6
	},
	{
		slug: 'kendaraan-transportasi',
		name: 'Kendaraan & Transportasi',
		description:
			'Sewa Hiace Premio, mobil MPV/EV keluarga & operasional, serta berbagai pilihan motor matic untuk mobilitas harian maupun rombongan.',
		icon: 'vehicle',
		accent: 'teal',
		sortOrder: 7
	},
	{
		slug: 'mainan-perlengkapan-anak',
		name: 'Mainan & Perlengkapan Anak',
		description:
			'Stroller, car seat, bouncer, jumperoo, Ergobaby, mobil & motor aki, perosotan, push bike, hingga trampoline anak higienis.',
		icon: 'baby',
		accent: 'orange',
		sortOrder: 8
	},
	{
		slug: 'camping-outdoor',
		name: 'Camping & Outdoor',
		description:
			'Tenda kapasitas 4–10 orang, tas carrier 35–85 liter, dan sepatu hiking size 38–45 siap menemani pendakian & kegiatan alam.',
		icon: 'camping',
		accent: 'lime',
		sortOrder: 9
	},
	{
		slug: 'wisuda-toga',
		name: 'Perlengkapan Wisuda',
		description:
			'Set toga wisuda S1, S2, dan S3 rapi, bersih, dan siap pakai untuk upacara kelulusan maupun sesi foto studio/keluarga.',
		icon: 'graduation',
		accent: 'slate',
		sortOrder: 10
	}
];

function slugifyItem(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

interface RawItemSpec {
	categorySlug: string;
	name: string;
	shortDescription: string;
	description?: string;
	specs: RentalItemSpec[];
	includes: string[];
	variants?: string[];
	unitLabel?: string;
	stockQty?: number;
	requiresDeposit?: boolean;
	isFeatured?: boolean;
}

const RAW_ITEMS: RawItemSpec[] = [
	// =========================================================================
	// 1. PROYEKTOR & DISPLAY (33 item)
	// =========================================================================
	...[
		{ lumens: '2600', room: 'Ruang rapat kecil (10–20 orang)', featured: false },
		{ lumens: '2700', room: 'Ruang rapat & kelas kecil (15–25 orang)', featured: false },
		{ lumens: '2800', room: 'Presentasi ruangan & nobar rumahan (15–30 orang)', featured: false },
		{ lumens: '3000', room: 'Meeting kantor & workshop (20–40 orang)', featured: false },
		{ lumens: '3200', room: 'Kelas pelatihan & ruang seminar kecil (25–50 orang)', featured: false },
		{ lumens: '3300', room: 'Seminar indoor dengan cahaya sedang (30–60 orang)', featured: false },
		{ lumens: '3500', room: 'Seminar, nobar & aula sedang (40–80 orang)', featured: true },
		{ lumens: '3600', room: 'Ruang rapat terang & ballroom kecil (50–90 orang)', featured: false },
		{ lumens: '3800', room: 'Presentasi korporat & acara indoor terang (60–100 orang)', featured: false },
		{ lumens: '4200', room: 'Aula besar & konferensi (80–150 orang)', featured: false },
		{ lumens: '5500', room: 'Ballroom hotel, wedding & nobar skala besar (150–300 orang)', featured: true },
		{ lumens: '10.000', room: 'Festival, konser, panggung utama & outdoor (>300 orang)', featured: false }
	].map((p) => ({
		categorySlug: 'proyektor-display',
		name: `Proyektor ${p.lumens} Lumens`,
		shortDescription: `Proyektor kecerahan ${p.lumens} ANSI lumens ideal untuk ${p.room.toLowerCase()}.`,
		description: `Unit proyektor ${p.lumens} lumens dalam kondisi terawat dan siap pakai untuk kebutuhan presentasi, seminar, nonton bareng (nobar), maupun acara pernikahan.\n\nCocok untuk ${p.room}. Tersedia pula pilihan layar (screen) tripod maupun giant screen serta kabel HDMI panjang agar instalasi di lokasi berjalan mulus.`,
		specs: [
			{ label: 'Tingkat Kecerahan', value: `${p.lumens} ANSI Lumens` },
			{ label: 'Rekomendasi Kapasitas', value: p.room },
			{ label: 'Konektivitas', value: 'HDMI & VGA' },
			{ label: 'Layanan', value: 'Delivery DKI–Jabar–Jateng–DIY / Ambil di Kios' }
		],
		includes: ['Unit Proyektor', 'Kabel Power', 'Kabel HDMI standar', 'Remote Control', 'Tas Proyektor'],
		stockQty: 5,
		isFeatured: p.featured
	})),
	...[
		{ inch: '71', dim: '± 180 × 180 cm', fit: 'Ruang meeting, kelas & nobar rumahan' },
		{ inch: '84', dim: '± 213 × 213 cm', fit: 'Seminar ruangan, pelatihan & acara kantor' },
		{ inch: '94', dim: '± 240 × 180 cm', fit: 'Aula sedang, presentasi publik & event indoor' }
	].map((s) => ({
		categorySlug: 'proyektor-display',
		name: `Screen Proyektor ${s.inch} Inch`,
		shortDescription: `Layar proyektor portabel ukuran ${s.inch} inch (${s.dim}) dengan permukaan matte white anti-silau.`,
		description: `Screen proyektor ukuran ${s.inch} inch mudah dipasang dan dilipat, menghasilkan tampilan proyeksi yang tajam serta merata dari berbagai sudut pandang.\n\nIdeal dipadukan dengan proyektor 2.600 hingga 5.500 lumens untuk ${s.fit.toLowerCase()}.`,
		specs: [
			{ label: 'Ukuran Diagonal', value: `${s.inch} Inch` },
			{ label: 'Estimasi Dimensi', value: s.dim },
			{ label: 'Rekomendasi Acara', value: s.fit },
			{ label: 'Tipe Rangka', value: 'Tripod / Portable Stand' }
		],
		includes: ['Layar Screen Proyektor', 'Rangka Tripod/Stand Penyangga'],
		stockQty: 6
	})),
	{
		categorySlug: 'proyektor-display',
		name: 'Stand Proyektor',
		shortDescription: 'Meja tripod penyangga proyektor dengan ketinggian fleksibel dan tray stabil.',
		specs: [
			{ label: 'Fungsi', value: 'Penyangga Proyektor / Laptop' },
			{ label: 'Pengaturan Tinggi', value: 'Adjustable Tripod' },
			{ label: 'Material', value: 'Baja kokoh dengan alas anti-slip' }
		],
		includes: ['Tripod Stand', 'Tray Alas Proyektor', 'Strap Pengaman'],
		stockQty: 8
	},
	...[
		{ inch: '32', use: 'Booth pameran kecil, monitor backstage & ruang tunggu', featured: false },
		{ inch: '42', use: 'Stand pameran, ruang meeting & TV matador panggung', featured: false },
		{ inch: '55', use: 'Booth pameran premium, ruang seminar & display video profil', featured: true },
		{ inch: '65', use: 'Konferensi, pameran besar, wedding & display presentasi', featured: false },
		{ inch: '75', use: 'Ballroom, konferensi pers & visual acara skala besar', featured: false },
		{ inch: '85', use: 'Display utama panggung indoor, pameran flagship & gala dinner', featured: false }
	].map((tv) => ({
		categorySlug: 'proyektor-display',
		name: `TV LED ${tv.inch} Inch`,
		shortDescription: `Layar TV LED ${tv.inch} inch tajam dengan input HDMI/USB, cocok untuk ${tv.use.toLowerCase()}.`,
		description: `Unit TV LED ${tv.inch} inch siap pakai untuk menampilkan materi presentasi, video company profile, live feed kamera, maupun layar matador (prompter) di depan panggung.\n\nDapat disewa terpisah maupun bersama Stand TV LED standing beroda agar penempatan lebih rapi dan profesional.`,
		specs: [
			{ label: 'Ukuran Layar', value: `${tv.inch} Inch` },
			{ label: 'Input Signal', value: 'HDMI, USB Media Player' },
			{ label: 'Rekomendasi Penggunaan', value: tv.use },
			{ label: 'Opsi Penempatan', value: 'Standing Bracket / Meja' }
		],
		includes: ['Unit TV LED', 'Remote Control', 'Kabel Power', 'Kabel HDMI standar'],
		stockQty: 4,
		isFeatured: tv.featured
	})),
	{
		categorySlug: 'proyektor-display',
		name: 'Stand TV LED',
		shortDescription: 'Standing bracket TV LED beroda kokoh untuk ukuran 32 hingga 85 inch.',
		specs: [
			{ label: 'Kompatibilitas', value: 'TV LED 32" – 85" (VESA universal)' },
			{ label: 'Mobilitas', value: 'Roda pengunci (lockable caster)' },
			{ label: 'Material', value: 'Rangka besi heavy-duty hitam' }
		],
		includes: ['Standing Bracket TV', 'Set Baut VESA'],
		stockQty: 8
	},
	...[
		{ pitch: '1.8', detail: 'Kerapatan pixel sangat halus (P1.8) untuk jarak pandang dekat & backdrop indoor HD.' },
		{ pitch: '2.5', detail: 'Layar LED Videotron P2.5 ideal untuk panggung seminar, wedding, dan konser indoor.' }
	].map((v) => ({
		categorySlug: 'proyektor-display',
		name: `Videotron ${v.pitch}`,
		shortDescription: `Panel LED Videotron pitch ${v.pitch} dengan tampilan cerah & tajam untuk backdrop panggung profesional.`,
		description: `${v.detail}\n\nCocok untuk acara korporat, peluncuran produk, seminar skala besar, hingga resepsi pernikahan. Hubungi CS untuk penentuan ukuran meter persegi (m²) serta dukungan operator & instalasi di lokasi.`,
		specs: [
			{ label: 'Pixel Pitch', value: `P${v.pitch} Indoor LED` },
			{ label: 'Aplikasi', value: 'Backdrop Panggung, Seminar, Gala & Wedding' },
			{ label: 'Instalasi', value: 'Termasuk konfigurasi processor (sesuai paket)' }
		],
		includes: ['Modul Panel LED Videotron', 'Video Processor & Kabel Data', 'Struktur Rangka (sesuai kebutuhan)'],
		unitLabel: 'event',
		requiresDeposit: true,
		stockQty: 2
	})),
	{
		categorySlug: 'proyektor-display',
		name: 'Pointer Presentasi',
		shortDescription: 'Laser pointer wireless untuk navigasi slide presentasi yang lebih leluasa di depan audiens.',
		specs: [
			{ label: 'Koneksi', value: 'Wireless USB Receiver 2.4GHz' },
			{ label: 'Fitur', value: 'Next/Prev Slide & Laser Pointer' },
			{ label: 'Kompatibilitas', value: 'Windows & macOS (Plug & Play)' }
		],
		includes: ['Unit Wireless Presenter', 'USB Receiver', 'Baterai'],
		stockQty: 10
	},
	...['20 M', '25 M', '30 M', '50 M'].map((len) => ({
		categorySlug: 'proyektor-display',
		name: `Kabel HDMI ${len}`,
		shortDescription: `Kabel HDMI panjang ${len} untuk menghubungkan laptop/switcher ke proyektor, TV LED, atau videotron jarak jauh.`,
		specs: [
			{ label: 'Panjang Kabel', value: len },
			{ label: 'Tipe Konektor', value: 'HDMI Male to Male' },
			{ label: 'Fungsi', value: 'Transmisi video & audio HD jarak jauh' }
		],
		includes: [`1 Roll Kabel HDMI ${len}`],
		stockQty: 6
	})),
	{
		categorySlug: 'proyektor-display',
		name: 'Kabel VGA 20 M',
		shortDescription: 'Kabel VGA panjang 20 meter untuk koneksi proyektor atau perangkat display generasi VGA.',
		specs: [
			{ label: 'Panjang Kabel', value: '20 Meter' },
			{ label: 'Tipe Konektor', value: 'VGA 15-Pin Male to Male' }
		],
		includes: ['1 Roll Kabel VGA 20 M'],
		stockQty: 5
	},
	{
		categorySlug: 'proyektor-display',
		name: 'VGA Converter',
		shortDescription: 'Adaptor konverter HDMI ke VGA atau VGA ke HDMI untuk memastikan perangkat Anda kompatibel dengan proyektor.',
		specs: [
			{ label: 'Fungsi', value: 'Konversi sinyal display HDMI ↔ VGA' },
			{ label: 'Instalasi', value: 'Plug & Play tanpa driver' }
		],
		includes: ['Unit VGA Converter'],
		variants: ['HDMI to VGA', 'VGA to HDMI', 'Type-C to HDMI/VGA'],
		stockQty: 10
	},
	{
		categorySlug: 'proyektor-display',
		name: 'Zoom Pro',
		shortDescription: 'Sewa lisensi akun Zoom Pro / Meeting untuk webinar, rapat daring, dan hybrid event tanpa batas 40 menit.',
		description: `Solusi praktis bagi penyelenggara webinar, rapat organisasi, kuliah umum, maupun hybrid event yang membutuhkan ruang Zoom Pro harian tanpa harus berlangganan bulanan.\n\nTersedia pilihan kapasitas peserta sesuai kebutuhan acara Anda.`,
		specs: [
			{ label: 'Tipe Layanan', value: 'Lisensi Zoom Meeting Pro Harian' },
			{ label: 'Durasi Meeting', value: 'Tanpa batas 40 menit (hingga 24 jam)' },
			{ label: 'Fitur', value: 'Cloud/Local Recording, Breakout Room, Co-Host' }
		],
		includes: ['Akses Host / Link Meeting Terjadwal', 'Panduan Penggunaan Singkat'],
		variants: ['Kapasitas 100 Peserta', 'Kapasitas 300 Peserta', 'Kapasitas 500–1000 Peserta'],
		unitLabel: 'hari',
		stockQty: 10
	},

	// =========================================================================
	// 2. AUDIO & SOUND SYSTEM (21 item)
	// =========================================================================
	...[
		{ watt: '1000', scale: 'Gathering kecil, seminar kelas & acara rumahan (50–80 orang)', featured: false },
		{ watt: '2000', scale: 'Seminar ruangan, akustik & lamaran (80–150 orang)', featured: false },
		{ watt: '3000', scale: 'Resepsi indoor, acara kampus & gathering perusahaan (150–250 orang)', featured: false },
		{ watt: '4000', scale: 'Event aula besar & live band akustik (200–350 orang)', featured: false },
		{ watt: '5000', scale: 'Wedding ballroom, pensi & seminar skala besar (300–500 orang)', featured: true },
		{ watt: '10000', scale: 'Konser mini, panggung outdoor & festival kampus (500–1000 orang)', featured: false },
		{ watt: '12000', scale: 'Festival outdoor & panggung live music besar', featured: false },
		{ watt: '15000', scale: 'Event konser outdoor & panggung utama skala besar', featured: false },
		{ watt: '20000', scale: 'Konser besar, festival lapangan terbuka & crowd ribuan orang', featured: false }
	].map((s) => ({
		categorySlug: 'audio-sound-system',
		name: `Sound System ${s.watt} Watt`,
		shortDescription: `Paket audio profesional daya ${s.watt} watt untuk ${s.scale.toLowerCase()}.`,
		description: `Paket Sound System ${s.watt} Watt dirancang menghasilkan suara jernih, bertenaga, dan merata untuk ${s.scale.toLowerCase()}.\n\nDapat disesuaikan untuk kebutuhan MC, sambutan, pemutaran musik, hingga pertunjukan live band. Hubungi tim kami untuk detail komposisi speaker, subwoofer, mixer, dan kebutuhan operator/soundman di lokasi.`,
		specs: [
			{ label: 'Kapasitas Daya Audio', value: `${s.watt} Watt` },
			{ label: 'Skala Acara', value: s.scale },
			{ label: 'Konfigurasi', value: 'Speaker FOH, Mixer, Mic & Perkabelan' }
		],
		includes: ['Set Speaker Aktif/Pasif & Subwoofer (sesuai kapasitas)', 'Audio Mixer', 'Mikrofon & Stand', 'Kabel Audio & Power'],
		unitLabel: 'event',
		requiresDeposit: Number(s.watt) >= 5000,
		stockQty: 3,
		isFeatured: s.featured
	})),
	...[
		{ inch: '12', desc: 'Speaker portable aktif 12 inch praktis dengan baterai/AC & koneksi Bluetooth/USB untuk acara fleksibel.' },
		{ inch: '15', desc: 'Speaker portable aktif 15 inch bertenaga besar dengan bass mantap, cocok untuk senam, pengajian, & sosialisasi.' }
	].map((sp) => ({
		categorySlug: 'audio-sound-system',
		name: `Sound Portable ${sp.inch} Inch`,
		shortDescription: sp.desc,
		specs: [
			{ label: 'Ukuran Woofer', value: `${sp.inch} Inch` },
			{ label: 'Konektivitas', value: 'Bluetooth, USB, AUX, Input Mic' },
			{ label: 'Mobilitas', value: 'Trolley handle + roda (mudah dipindah)' }
		],
		includes: [`Unit Sound Portable ${sp.inch}"`, '2 Mic Wireless bawaan', 'Kabel Charger/Power'],
		stockQty: 5,
		isFeatured: sp.inch === '15'
	})),
	{
		categorySlug: 'audio-sound-system',
		name: 'Mixer 16 Channel',
		shortDescription: 'Audio mixer 16 channel untuk kontrol banyak mikrofon, instrumen band, dan jalur audio live streaming.',
		specs: [
			{ label: 'Jumlah Kanal', value: '16 Channel Input' },
			{ label: 'Aplikasi', value: 'Live Band, Seminar Multi-Panelis & Streaming' },
			{ label: 'Fitur', value: 'EQ per channel, Aux Send & Efek Vokal' }
		],
		includes: ['Unit Audio Mixer 16Ch', 'Kabel Power', 'Hardcase / Flightcase'],
		stockQty: 4
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Sound Card',
		shortDescription: 'Audio interface / sound card eksternal untuk kebutuhan rekaman, podcast, dan input audio bersih ke live streaming.',
		specs: [
			{ label: 'Fungsi', value: 'Audio Interface Recording & Live Streaming' },
			{ label: 'Konektivitas', value: 'USB ke Laptop/PC, Input XLR/TRS' }
		],
		includes: ['Unit Sound Card', 'Kabel USB', 'Kabel Audio standar'],
		stockQty: 5
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Mic Kabel',
		shortDescription: 'Mikrofon dinamis berkabel yang stabil tanpa khawatir baterai habis, cocok untuk MC, vokal, dan podium.',
		specs: [
			{ label: 'Tipe', value: 'Dynamic Vocal Microphone' },
			{ label: 'Konektivitas', value: 'Kabel XLR' }
		],
		includes: ['Unit Mic Kabel', 'Kabel Mic XLR', 'Holder Mic'],
		stockQty: 15
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Mic Wireless',
		shortDescription: 'Mikrofon nirkabel UHF jernih & bebas kusut untuk pembicara seminar, MC acara, hingga penyanyi.',
		specs: [
			{ label: 'Tipe', value: 'Wireless Handheld Microphone' },
			{ label: 'Kestabilan', value: 'Frekuensi UHF anti-putus' }
		],
		includes: ['Unit Mic Wireless', 'Receiver + Adaptor', 'Kabel Output ke Mixer'],
		stockQty: 12
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Stand Mic',
		shortDescription: 'Tiang penyangga mikrofon berdiri (boom/straight) kokoh untuk panggung, vokal, dan akustik.',
		specs: [
			{ label: 'Tipe', value: 'Floor Standing / Boom Mic Stand' },
			{ label: 'Tinggi', value: 'Adjustable' }
		],
		includes: ['Stand Mic', 'Clip Holder Mic'],
		stockQty: 15
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Stand Mic Table',
		shortDescription: 'Stand mikrofon meja ringkas untuk pembicara panel diskusi, rapat, dan podcast.',
		specs: [
			{ label: 'Tipe', value: 'Desktop / Table Mic Stand' },
			{ label: 'Aplikasi', value: 'Konferensi Pers, Rapat & Talkshow' }
		],
		includes: ['Stand Mic Meja', 'Clip Holder Mic'],
		stockQty: 12
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Stand Sound',
		shortDescription: 'Tripod penyangga speaker aktif/pasif heavy-duty agar proyeksi suara lebih merata ke seluruh ruangan.',
		specs: [
			{ label: 'Tipe', value: 'Tripod Speaker Stand Heavy-Duty' },
			{ label: 'Kompatibilitas', value: 'Speaker 10" – 15"' }
		],
		includes: ['1 Unit Tripod Stand Speaker'],
		stockQty: 12
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Megaphone / TOA',
		shortDescription: 'Pengeras suara genggam TOA untuk koordinasi lapangan, outbound, tour guide, dan panitia acara outdoor.',
		specs: [
			{ label: 'Tipe', value: 'Handheld Megaphone TOA' },
			{ label: 'Fitur', value: 'Suara lantang + mode sirine' }
		],
		includes: ['Unit Megaphone TOA', 'Strap Bahu'],
		stockQty: 8
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Handy Talkie ICOM V80',
		shortDescription: 'HT legendaris ICOM V80 berdaya pancar kuat & tangguh untuk koordinasi kru event, konser, dan EO.',
		specs: [
			{ label: 'Model', value: 'ICOM IC-V80 VHF' },
			{ label: 'Aplikasi', value: 'Koordinasi EO, Produksi & Keamanan Acara' },
			{ label: 'Daya Tahan', value: 'Baterai awet seharian penuh' }
		],
		includes: ['Unit HT ICOM V80', 'Antena & Baterai', 'Charger Desktop', 'Handsfree/Headset (opsional)'],
		stockQty: 25
	},
	{
		categorySlug: 'audio-sound-system',
		name: 'Handy Talkie Weirwei',
		shortDescription: 'HT Weirwei ringkas dan ekonomis untuk komunikasi tim panitia kampus, seminar, maupun wedding organizer.',
		specs: [
			{ label: 'Model', value: 'Weirwei VHF/UHF' },
			{ label: 'Aplikasi', value: 'Panitia Acara, Seminar & WO' }
		],
		includes: ['Unit HT Weirwei', 'Antena & Baterai', 'Charger'],
		stockQty: 25
	},

	// =========================================================================
	// 3. KAMERA, STREAMING & PHOTOBOOTH (14 item)
	// =========================================================================
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Kamera Mirrorless (Lumix, Sony RX100, Sony A5100, dll.)',
		shortDescription: 'Pilihan kamera mirrorless ringkas untuk vlog, dokumentasi acara, konten media sosial, hingga traveling.',
		description: `Tersedia beberapa seri kamera mirrorless populer (seperti Lumix, Sony RX100, Sony A5100, dan seri lainnya) dengan bobot ringan serta hasil foto/video tajam.\n\nPilih seri kamera yang diinginkan saat konfirmasi pemesanan agar tim kami menyiapkan lensa dan aksesori yang paling sesuai.`,
		specs: [
			{ label: 'Pilihan Seri', value: 'Lumix, Sony RX100, Sony A5100 & lainnya' },
			{ label: 'Kelebihan', value: 'Ringkas, cepat & cocok untuk foto/video' },
			{ label: 'Aplikasi', value: 'Konten Kreator, Dokumentasi & Travel' }
		],
		includes: ['Body Kamera + Lensa Kit', 'Baterai & Charger', 'Memory Card', 'Tas Kamera'],
		variants: ['Lumix', 'Sony RX100', 'Sony A5100', 'Seri Mirrorless Lainnya'],
		requiresDeposit: true,
		stockQty: 6,
		isFeatured: true
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Kamera DSLR (Nikon D90 – D850, D3, D5, D6)',
		shortDescription: 'Kamera DSLR Nikon mulai kelas entry hingga flagship profesional untuk dokumentasi event, wedding & komersial.',
		description: `Lini lengkap DSLR Nikon mulai dari D90, D5300, D5500 hingga full-frame dan flagship profesional seperti D700, D750, D800, D850, D3, D5, dan D6.\n\nSangat andal untuk fotografi liputan, wisuda, pernikahan, maupun pemotretan studio.`,
		specs: [
			{ label: 'Pilihan Seri', value: 'D90, D5300, D5500, D700, D750, D800, D850, D3, D5, D6' },
			{ label: 'Kategori', value: 'DX & Full-Frame FX Pro DSLR' },
			{ label: 'Aplikasi', value: 'Liputan Event, Wedding, Wisuda & Studio' }
		],
		includes: ['Body Kamera Nikon', 'Lensa (sesuai pilihan)', 'Baterai & Charger', 'Tas Kamera'],
		variants: ['Nikon D90', 'Nikon D5300', 'Nikon D5500', 'Nikon D700', 'Nikon D750', 'Nikon D800', 'Nikon D850', 'Nikon D3', 'Nikon D5', 'Nikon D6'],
		requiresDeposit: true,
		stockQty: 8
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Camcorder Sony NX100',
		shortDescription: 'Camcorder profesional Sony HXR-NX100 dengan sensor 1-inch & dual XLR audio untuk liputan & live streaming.',
		specs: [
			{ label: 'Model', value: 'Sony HXR-NX100 Full HD' },
			{ label: 'Input Audio', value: 'Dual XLR Profesional' },
			{ label: 'Output Video', value: 'HDMI & SDI (siap switcher streaming)' }
		],
		includes: ['Unit Sony NX100', 'Baterai & Charger', 'Tas Camcorder'],
		requiresDeposit: true,
		stockQty: 4
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'GoPro Hero 3–10',
		shortDescription: 'Action camera GoPro berbagai seri (Hero 3 hingga Hero 10) tahan air & stabil untuk olahraga, touring, dan wisata.',
		specs: [
			{ label: 'Pilihan Seri', value: 'GoPro Hero 3 hingga Hero 10' },
			{ label: 'Keunggulan', value: 'Ringkas, wide-angle & tahan air' }
		],
		includes: ['Unit GoPro', 'Baterai & Kabel Charge', 'Mounting standar'],
		variants: ['GoPro Hero 3–5', 'GoPro Hero 6–8', 'GoPro Hero 9', 'GoPro Hero 10'],
		requiresDeposit: true,
		stockQty: 6
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Drone',
		shortDescription: 'Unit drone kamera untuk pengambilan gambar & video udara (aerial) event outdoor, properti, dan wisata.',
		specs: [
			{ label: 'Fungsi', value: 'Foto & Video Aerial Stabil' },
			{ label: 'Opsi Sewa', value: 'Unit saja atau plus pilot (sesuai kebutuhan)' }
		],
		includes: ['Unit Drone', 'Remote Controller', 'Baterai & Charger', 'Tas Drone'],
		requiresDeposit: true,
		stockQty: 3
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Flash SB Nikon Kamera',
		shortDescription: 'Speedlight eksternal Nikon SB Series untuk pencahayaan foto indoor/outdoor yang lebih terang dan natural.',
		specs: [
			{ label: 'Kompatibilitas', value: 'Hot-shoe Kamera Nikon (i-TTL)' },
			{ label: 'Fungsi', value: 'Lighting foto event, wedding & indoor minim cahaya' }
		],
		includes: ['Unit Flash Nikon SB', 'Diffuser / Pouch'],
		stockQty: 6
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Tripod Kamera',
		shortDescription: 'Tripod kokoh untuk menopang kamera foto, camcorder, maupun setup live streaming agar bebas goyang.',
		specs: [
			{ label: 'Kompatibilitas', value: 'DSLR, Mirrorless & Camcorder' },
			{ label: 'Fitur', value: 'Quick release plate & fluid/pan head' }
		],
		includes: ['Unit Tripod', 'Tas Tripod'],
		stockQty: 10
	},
	...[2, 3, 4, 5].map((cams) => ({
		categorySlug: 'kamera-streaming-booth',
		name: `Paket Streaming ${cams} Kamera`,
		shortDescription: `Paket produksi live streaming multi-angle ${cams} kamera untuk YouTube, Zoom, seminar hybrid, wisuda & wedding.`,
		description: `Solusi live streaming terima beres dengan ${cams} sudut kamera untuk hasil siaran layaknya produksi televisi.\n\nCocok untuk seminar nasional, wisuda, peluncuran produk, pengajian akbar, hingga pernikahan. Dilengkapi video switcher, capture card, audio feed, serta opsi operator & kameramen profesional.`,
		specs: [
			{ label: 'Jumlah Kamera', value: `${cams} Kamera Multi-Angle` },
			{ label: 'Platform Tujuan', value: 'YouTube Live, Zoom, Instagram, RTMP' },
			{ label: 'Sistem', value: 'Video Switcher + Audio Sync + Monitoring' }
		],
		includes: [`${cams} Unit Kamera + Tripod`, 'Video Switcher & Capture System', 'Kabel Video & Audio Routing', 'Setup & Pengujian Siaran'],
		unitLabel: 'event',
		requiresDeposit: true,
		stockQty: 2,
		isFeatured: cams === 3
	})),
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Photobooth',
		shortDescription: 'Layanan photobooth cetak instan untuk memeriahkan wedding, gathering kantor, sweet seventeen, dan wisuda.',
		specs: [
			{ label: 'Output', value: 'Foto cetak instan + softcopy digital' },
			{ label: 'Cocok Untuk', value: 'Wedding, Corporate Gathering & Prom Night' }
		],
		includes: ['Setup Kamera & Lighting Studio', 'Printer Cetak Cepat', 'Properti Foto Fun Props'],
		unitLabel: 'event',
		stockQty: 3
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Mirror Booth',
		shortDescription: 'Photobooth cermin interaktif layar sentuh berukuran penuh yang elegan untuk resepsi dan gala event.',
		specs: [
			{ label: 'Tipe', value: 'Interactive Full-Length Magic Mirror Booth' },
			{ label: 'Cocok Untuk', value: 'Wedding Elegan, Gala Dinner & Brand Activation' }
		],
		includes: ['Unit Mirror Booth', 'Lighting & Printer', 'Template Frame Custom'],
		unitLabel: 'event',
		stockQty: 2
	},
	{
		categorySlug: 'kamera-streaming-booth',
		name: 'Video Booth 360',
		shortDescription: 'Platform Video Booth 360° slow-motion yang estetik dan langsung siap dibagikan tamu ke media sosial.',
		specs: [
			{ label: 'Tipe', value: '360° Rotating Slow-Motion Video Platform' },
			{ label: 'Output', value: 'Video siap share via QR/AirDrop/WA' }
		],
		includes: ['Platform 360° & Arm Kamera', 'Ring/LED Lighting', 'Efek Overlay Video'],
		unitLabel: 'event',
		stockQty: 2,
		isFeatured: true
	},

	// =========================================================================
	// 4. GADGET, LAPTOP & GAMING (13 item)
	// =========================================================================
	...[
		{ gen: '12', note: 'Kamera Pro 12MP & layar Super Retina XDR 6,7" untuk dokumentasi & konten harian.', featured: false },
		{ gen: '13', note: 'Layar ProMotion 120Hz & Cinematic Mode, favorit untuk pembuatan konten video tajam.', featured: false },
		{ gen: '14', note: 'Kamera utama 48MP, Action Mode & Dynamic Island untuk liputan konser maupun traveling.', featured: false },
		{ gen: '15', note: 'Bodi Titanium, USB-C & lensa telefoto 5x optical zoom — sangat populer untuk konser & konten pro.', featured: false },
		{ gen: '16', note: 'Kamera 48MP Fusion, perekaman 4K 120fps Dolby Vision & tombol Camera Control terbaru.', featured: true },
		{ gen: '17', note: 'Seri flagship terbaru performa & kamera maksimal untuk kebutuhan konten, konser, dan eksekutif.', featured: false }
	].map((ip) => ({
		categorySlug: 'gadget-laptop-gaming',
		name: `iPhone ${ip.gen} Pro Max`,
		shortDescription: `Sewa iPhone ${ip.gen} Pro Max terawat — ${ip.note}`,
		description: `Unit iPhone ${ip.gen} Pro Max dalam kondisi prima, bersih, dan siap digunakan untuk liputan konser, pembuatan konten Reels/TikTok, kebutuhan presentasi, maupun pemakaian harian sementara.\n\nPenyewaan gadget flagship memerlukan verifikasi identitas dan Nomor HP Darurat demi keamanan bersama.`,
		specs: [
			{ label: 'Model', value: `iPhone ${ip.gen} Pro Max` },
			{ label: 'Rekomendasi', value: 'Konser, Konten Media Sosial & Event' },
			{ label: 'Kondisi', value: 'Original, bersih & dicek sebelum serah terima' }
		],
		includes: [`Unit iPhone ${ip.gen} Pro Max`, 'Kabel Charger', 'Softcase Pelindung'],
		requiresDeposit: true,
		stockQty: 4,
		isFeatured: ip.featured
	})),
	...[
		{ series: 'Flow', note: 'Laptop gaming/kreator ringkas & fleksibel dengan performa tinggi untuk mobilitas & presentasi berat.', featured: false },
		{ series: 'Strix', note: 'Laptop gaming bertenaga penuh dengan pendinginan ekstra untuk turnamen esports, 3D rendering, & live streaming.', featured: false },
		{ series: 'Zephyrus', note: 'Laptop performa tinggi berdesain tipis dan elegan untuk video editing, desain grafis, & kebutuhan eksekutif.', featured: true }
	].map((rog) => ({
		categorySlug: 'gadget-laptop-gaming',
		name: `Laptop ROG ${rog.series}`,
		shortDescription: rog.note,
		specs: [
			{ label: 'Seri', value: `ASUS ROG ${rog.series}` },
			{ label: 'Kegunaan', value: 'Esports, Editing Video, Live Streaming, 3D & Presentasi' },
			{ label: 'Sistem', value: 'Dedicated GPU & layar refresh rate tinggi' }
		],
		includes: [`Unit Laptop ASUS ROG ${rog.series}`, 'Adaptor Charger Original', 'Tas Laptop'],
		requiresDeposit: true,
		stockQty: 4,
		isFeatured: rog.featured
	})),
	...[
		{ gen: '3', note: 'Konsol PlayStation 3 ekonomis lengkap dengan stik & koleksi game populer untuk hiburan keluarga/kos.' },
		{ gen: '4', note: 'Konsol PlayStation 4 favorit untuk mabar, gathering kantor, hingga hiburan akhir pekan di rumah.' },
		{ gen: '5', note: 'Konsol generasi terbaru PlayStation 5 dengan grafis 4K mulus & kontroler DualSense untuk event & mabar.' }
	].map((ps) => ({
		categorySlug: 'gadget-laptop-gaming',
		name: `PlayStation ${ps.gen}`,
		shortDescription: ps.note,
		specs: [
			{ label: 'Konsol', value: `Sony PlayStation ${ps.gen}` },
			{ label: 'Kontroler', value: 'Termasuk 2 Stik Wireless' },
			{ label: 'Koneksi', value: 'HDMI (bisa sepaket dengan TV LED)' }
		],
		includes: [`Konsol PlayStation ${ps.gen}`, '2 Stik Kontroler', 'Kabel HDMI & Kabel Power', 'Pilihan Game Terinstal'],
		requiresDeposit: true,
		stockQty: 4,
		isFeatured: ps.gen === '5'
	})),
	{
		categorySlug: 'gadget-laptop-gaming',
		name: 'Mesin Fotokopi Canon',
		shortDescription: 'Sewa mesin fotokopi Canon kecepatan tinggi untuk sekretariat event, panitia seminar, ujian, maupun kantor sementara.',
		specs: [
			{ label: 'Merek', value: 'Canon Multifungsi' },
			{ label: 'Fungsi', value: 'Copy, Print & Scan volume tinggi' },
			{ label: 'Cocok Untuk', value: 'Sekretariat Acara, Proyek Lapangan & Kantor' }
		],
		includes: ['Unit Mesin Fotokopi Canon', 'Kabel Power & Toner Siap Pakai'],
		requiresDeposit: true,
		stockQty: 2
	},

	// =========================================================================
	// 5. EVENT, LIGHTING, GENSET & PERLENGKAPAN (24 item)
	// =========================================================================
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Lighting Beam 230W',
		shortDescription: 'Moving head Beam 230W bertenaga tajam untuk efek sorot dinamis konser, wedding, dan panggung besar.',
		specs: [
			{ label: 'Daya Lampu', value: '230 Watt Moving Head Beam' },
			{ label: 'Kontrol', value: 'DMX512 / Sound Active' }
		],
		includes: ['Unit Moving Head Beam 230W', 'Kabel Power & DMX'],
		unitLabel: 'event',
		stockQty: 8
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Lighting Follow Spot',
		shortDescription: 'Lampu sorot fokus manual (follow spot) untuk menyorot pengantin, bintang tamu, atau pembicara utama di panggung.',
		specs: [
			{ label: 'Fungsi', value: 'Sorot Fokus Pengantin / Guest Star' },
			{ label: 'Kelengkapan', value: 'Tripod Stand Follow Spot' }
		],
		includes: ['Unit Follow Spot', 'Tripod Stand', 'Kabel Power'],
		unitLabel: 'event',
		stockQty: 4
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Lighting Laser 4 Eye RGB',
		shortDescription: 'Efek laser 4 mata full-color RGB untuk suasana panggung meriah, DJ performance, dan party.',
		specs: [
			{ label: 'Tipe', value: '4 Eye RGB Laser Effect' },
			{ label: 'Aplikasi', value: 'Konser, DJ Set, Party & Prom Night' }
		],
		includes: ['Unit Laser 4 Eye RGB', 'Kabel Power'],
		unitLabel: 'event',
		stockQty: 4
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Lighting ParLED RGB',
		shortDescription: 'Lampu ParLED RGB serbaguna untuk pencahayaan panggung, pelaminan, backdrop, dan ambience ruangan.',
		specs: [
			{ label: 'Tipe', value: 'ParLED Full Color RGBW' },
			{ label: 'Aplikasi', value: 'Wash Panggung, Backdrop & Dekorasi Ruangan' }
		],
		includes: ['Unit ParLED RGB', 'Kabel Power'],
		unitLabel: 'event',
		stockQty: 20
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Lighting Pro Set',
		shortDescription: 'Paket lengkap tata cahaya panggung profesional (ParLED, Moving Head, Mixer DMX & stand/rigging) terima beres.',
		specs: [
			{ label: 'Paket', value: 'Kombinasi ParLED + Beam + DMX Controller' },
			{ label: 'Cocok Untuk', value: 'Konser, Wedding Ballroom & Corporate Gala' }
		],
		includes: ['Set Lampu ParLED & Moving Head', 'Mixer Lighting DMX', 'Stand / Truss & Perkabelan'],
		unitLabel: 'event',
		requiresDeposit: true,
		stockQty: 2,
		isFeatured: true
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Panggung 6m × 10m',
		shortDescription: 'Struktur panggung kokoh ukuran 6 × 10 meter siap pasang untuk konser, festival, upacara, dan acara skala besar.',
		specs: [
			{ label: 'Dimensi', value: '6 Meter × 10 Meter (60 m²)' },
			{ label: 'Finishing', value: 'Lantai multipleks + karpet (sesuai paket)' },
			{ label: 'Instalasi', value: 'Pemasangan & pembongkaran oleh tim' }
		],
		includes: ['Rangka Panggung 6×10m', 'Tangga Akses Panggung', 'Pemasangan di Lokasi'],
		unitLabel: 'event',
		requiresDeposit: true,
		stockQty: 2
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Backdrop Lamaran',
		shortDescription: 'Set backdrop estetik untuk acara lamaran, tunangan, akad nikah, maupun photo corner keluarga.',
		specs: [
			{ label: 'Aplikasi', value: 'Lamaran, Tunangan, Akad & Photo Wall' },
			{ label: 'Pemasangan', value: 'Rapi & siap pakai di rumah atau venue' }
		],
		includes: ['Rangka Backdrop', 'Kain & Elemen Dekorasi Dasar', 'Lampu Sorot Dekoratif'],
		unitLabel: 'event',
		stockQty: 3
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Smoke Gun',
		shortDescription: 'Mesin pembuat efek asap (smoke machine / smoke gun) untuk mempertegas sorotan lighting dan suasana panggung.',
		specs: [
			{ label: 'Fungsi', value: 'Efek Asap Panggung & Pencahayaan' },
			{ label: 'Aplikasi', value: 'Konser, Wedding Entrance, Foto & Video Klip' }
		],
		includes: ['Unit Smoke Gun / Machine', 'Cairan Smoke secukupnya'],
		unitLabel: 'event',
		stockQty: 4
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Kursi Futura',
		shortDescription: 'Kursi susun Futura standar event & resepsi yang rapi dan nyaman, tersedia dalam jumlah puluhan hingga ratusan unit.',
		specs: [
			{ label: 'Tipe', value: 'Kursi Susun Futura Rangka Chrome' },
			{ label: 'Opsi Tambahan', value: 'Tersedia dengan atau tanpa sarung kursi' }
		],
		includes: ['Unit Kursi Futura bersih siap susun'],
		variants: ['Polos', 'Dengan Sarung Kursi + Pita'],
		stockQty: 200
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Roll Top (Pemanas Prasmanan)',
		shortDescription: 'Chafing dish / pemanas prasmanan model roll top stainless elegan untuk jamuan catering, rapat, dan resepsi.',
		specs: [
			{ label: 'Tipe', value: 'Roll Top Chafing Dish Stainless Steel' },
			{ label: 'Fungsi', value: 'Menjaga hidangan prasmanan tetap hangat & higienis' }
		],
		includes: ['Wadah Roll Top Stainless', 'Water Pan & Food Pan', 'Tempat Sterno'],
		stockQty: 20
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Scaffolding',
		shortDescription: 'Perancah besi scaffolding kokoh untuk pekerjaan konstruksi, dekorasi tinggi, rigging lampu, dan menara kamera.',
		specs: [
			{ label: 'Tipe', value: 'Main Frame + Cross Brace + Joint Pin' },
			{ label: 'Aplikasi', value: 'Renovasi, Dekorasi Venue & Tower FOH/Kamera' }
		],
		includes: ['1 Set Rangka Scaffolding Lengkap'],
		stockQty: 20
	},
	...[
		{ watt: '10.000', kva: '± 10–12 kVA', use: 'Acara rumahan, tenda wedding, sound 3000–5000W & AC portable' },
		{ watt: '15.000', kva: '± 15–18 kVA', use: 'Event outdoor menengah, sound system besar & pencahayaan' },
		{ watt: '20.000', kva: '± 20–25 kVA', use: 'Panggung utama, videotron, sound besar & festival outdoor' }
	].map((g) => ({
		categorySlug: 'event-lighting-panggung',
		name: `Genset ${g.watt} Watt`,
		shortDescription: `Generator listrik cadangan kapasitas ${g.watt} watt (${g.kva}) untuk pasokan daya stabil di acara Anda.`,
		description: `Unit Genset kapasitas ${g.watt} Watt siap memasok daya listrik stabil agar acara bebas risiko mati lampu.\n\nCocok untuk ${g.use.toLowerCase()}. Hubungi CS untuk detail kebutuhan kabel power, bahan bakar, dan teknisi jaga.`,
		specs: [
			{ label: 'Kapasitas Daya', value: `${g.watt} Watt (${g.kva})` },
			{ label: 'Rekomendasi', value: g.use },
			{ label: 'Layanan', value: 'Antar-jemput & setup kabel distribusi' }
		],
		includes: [`Unit Genset ${g.watt} Watt`, 'Kabel Distribusi Power standar'],
		unitLabel: 'event',
		requiresDeposit: true,
		stockQty: 3,
		isFeatured: g.watt === '10.000'
	})),
	...['25M', '50M'].map((len) => ({
		categorySlug: 'event-lighting-panggung',
		name: `Kabel Roll ${len}`,
		shortDescription: `Kabel rol listrik heavy-duty panjang ${len} untuk distribusi daya acara indoor maupun outdoor.`,
		specs: [
			{ label: 'Panjang Kabel', value: len === '25M' ? '25 Meter' : '50 Meter' },
			{ label: 'Aplikasi', value: 'Sumber listrik panggung, booth & tenda' }
		],
		includes: [`1 Unit Kabel Roll ${len}`],
		stockQty: 10
	})),
	{
		categorySlug: 'event-lighting-panggung',
		name: 'AC Portable',
		shortDescription: 'Pendingin ruangan AC portable praktis tanpa bobok dinding, ideal untuk ruang VIP, tenda tertutup, dan booth pameran.',
		specs: [
			{ label: 'Tipe', value: 'AC Portable Standing dengan Selang Pembuangan' },
			{ label: 'Aplikasi', value: 'Ruang Rias/VIP, Kantor Sementara & Booth Indoor' }
		],
		includes: ['Unit AC Portable', 'Selang Exhaust', 'Remote Control'],
		stockQty: 6
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Blower / Kipas Embun / Misty Fan (Krisbow)',
		shortDescription: 'Kipas angin kabut air (Misty Fan) merek Krisbow penyejuk efektif untuk tenda outdoor, resepsi, dan acara siang hari.',
		specs: [
			{ label: 'Merek', value: 'Krisbow Heavy-Duty' },
			{ label: 'Fitur', value: 'Tangki air + semprotan embun halus' },
			{ label: 'Cocok Untuk', value: 'Tenda Pernikahan, Bazaar & Event Outdoor' }
		],
		includes: ['Unit Misty Fan Krisbow', 'Tangki Air Terintegrasi'],
		stockQty: 12,
		isFeatured: true
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Air Purifier',
		shortDescription: 'Penjernih udara dengan filter HEPA untuk menjaga kualitas udara ruang meeting, ruang bayi, maupun acara indoor.',
		specs: [
			{ label: 'Sistem Filtrasi', value: 'HEPA Filter Multi-Layer' },
			{ label: 'Aplikasi', value: 'Ruang Rapat, Rumah, Kamar Bayi & Klinik' }
		],
		includes: ['Unit Air Purifier bersih siap pakai'],
		stockQty: 5
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Water Purifier',
		shortDescription: 'Perangkat pemurni air minum higienis untuk kebutuhan rumah tangga sementara, kantor proyek, dan acara.',
		specs: [
			{ label: 'Fungsi', value: 'Filtrasi & Penyedia Air Minum Bersih' },
			{ label: 'Aplikasi', value: 'Kantor, Rumah & Area Pantry Event' }
		],
		includes: ['Unit Water Purifier siap pakai'],
		stockQty: 3
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Dispenser',
		shortDescription: 'Dispenser air minum panas & dingin untuk ruang rapat, posko panitia, seminar, maupun acara keluarga.',
		specs: [
			{ label: 'Fitur', value: 'Air Panas, Normal & Dingin' },
			{ label: 'Aplikasi', value: 'Pantry Event, Seminar & Posko Panitia' }
		],
		includes: ['Unit Dispenser bersih siap pakai'],
		stockQty: 6
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Kompor Portable',
		shortDescription: 'Kompor gas portable ringkas untuk kegiatan camping, demo masak, bazar kuliner, maupun acara keluarga.',
		specs: [
			{ label: 'Tipe', value: 'Kompor Gas Kaleng Portable 1 Tungku' },
			{ label: 'Mobilitas', value: 'Termasuk koper plastik ringkas' }
		],
		includes: ['Unit Kompor Portable', 'Koper Penyimpanan'],
		stockQty: 10
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Tangga Lipat 4M',
		shortDescription: 'Tangga aluminium lipat kokoh tinggi hingga 4 meter untuk instalasi dekorasi, spanduk, lampu, dan perawatan gedung.',
		specs: [
			{ label: 'Tinggi Maksimal', value: '4 Meter (Multi-posisi)' },
			{ label: 'Material', value: 'Aluminium ringan & anti-karat' }
		],
		includes: ['1 Unit Tangga Lipat 4M'],
		stockQty: 5
	},
	{
		categorySlug: 'event-lighting-panggung',
		name: 'Trolley Barang Krisbow',
		shortDescription: 'Troli dorong barang lipat merek Krisbow untuk mempermudah angkut logistik event, pameran, dan pindahan.',
		specs: [
			{ label: 'Merek', value: 'Krisbow Foldable Platform Trolley' },
			{ label: 'Aplikasi', value: 'Angkut Logistik Pameran, Sound & Gudang' }
		],
		includes: ['1 Unit Trolley Barang Krisbow'],
		stockQty: 6
	},

	// =========================================================================
	// 6. ALAT MUSIK (10 item)
	// =========================================================================
	{
		categorySlug: 'alat-musik',
		name: 'Alat DJ',
		shortDescription: 'Set controller/deck DJ profesional untuk memeriahkan after-party, wedding reception, grand opening, dan festival.',
		specs: [
			{ label: 'Tipe', value: 'DJ Controller / Deck Setup' },
			{ label: 'Aplikasi', value: 'Party, Wedding, Lounge & Event Kampus' }
		],
		includes: ['Unit DJ Controller/Deck', 'Kabel Audio RCA/TRS & Power'],
		requiresDeposit: true,
		stockQty: 3
	},
	{
		categorySlug: 'alat-musik',
		name: 'Ampli Gitar',
		shortDescription: 'Amplifier gitar bertenaga jernih untuk latihan band, panggung akustik, maupun live performance.',
		specs: [
			{ label: 'Fungsi', value: 'Amplifier Gitar Elektrik / Akustik' },
			{ label: 'Fitur', value: 'Clean & Drive Channel + EQ' }
		],
		includes: ['Unit Ampli Gitar', 'Kabel Power'],
		stockQty: 5
	},
	{
		categorySlug: 'alat-musik',
		name: 'Bass Listrik',
		shortDescription: 'Gitar bass elektrik terawat dengan setting nyaman untuk panggung band, akustik, dan sesi rekaman.',
		specs: [
			{ label: 'Tipe', value: '4-String Electric Bass Guitar' },
			{ label: 'Kondisi', value: 'Senar terawat & siap tampil' }
		],
		includes: ['Unit Bass Listrik', 'Softcase/Gigbag', 'Kabel Jack & Strap'],
		stockQty: 4
	},
	{
		categorySlug: 'alat-musik',
		name: 'Biola',
		shortDescription: 'Biola akustik lengkap dengan bow & rosin untuk pentas seni, pengiring resepsi, maupun sesi pemotretan.',
		specs: [
			{ label: 'Tipe', value: 'Biola Akustik 4/4' },
			{ label: 'Aplikasi', value: 'Pentas, Wedding Akustik & Properti Foto' }
		],
		includes: ['Unit Biola', 'Bow (Penggesek)', 'Hardcase'],
		stockQty: 4
	},
	{
		categorySlug: 'alat-musik',
		name: 'Cajon',
		shortDescription: 'Perkusi cajon akustik ringkas berkarakter bass hangat, cocok untuk live akustik kafe, lamaran, dan gathering.',
		specs: [
			{ label: 'Tipe', value: 'Acoustic Box Cajon dengan Snare Wire' },
			{ label: 'Aplikasi', value: 'Band Akustik, Kafe & Gathering' }
		],
		includes: ['Unit Cajon', 'Tas Cajon'],
		stockQty: 5
	},
	{
		categorySlug: 'alat-musik',
		name: 'Drum Elektrik',
		shortDescription: 'Set drum elektrik responsif dengan kontrol volume fleksibel — ideal untuk panggung indoor & ruangan terbatas.',
		specs: [
			{ label: 'Tipe', value: 'Electronic Drum Kit Lengkap' },
			{ label: 'Keunggulan', value: 'Volume mudah diatur untuk venue indoor/hotel' }
		],
		includes: ['Modul & Pad Drum Elektrik', 'Pedal Kick & Hi-Hat', 'Bangku Drum & Stik'],
		requiresDeposit: true,
		stockQty: 3,
		isFeatured: true
	},
	{
		categorySlug: 'alat-musik',
		name: 'Gitar Akustik',
		shortDescription: 'Gitar akustik-elektrik nyaman dimainkan dengan pickup siap colok ke mixer/sound system.',
		specs: [
			{ label: 'Tipe', value: 'Gitar Akustik / Akustik-Elektrik' },
			{ label: 'Kondisi', value: 'Senar prima & siap tampil' }
		],
		includes: ['Unit Gitar Akustik', 'Gigbag/Tas Gitar', 'Kabel Jack'],
		stockQty: 6
	},
	{
		categorySlug: 'alat-musik',
		name: 'Gitar Listrik',
		shortDescription: 'Gitar elektrik siap manggung untuk pertunjukan band, pensi, maupun latihan bersama.',
		specs: [
			{ label: 'Tipe', value: 'Electric Guitar 6-String' },
			{ label: 'Aplikasi', value: 'Live Band, Pensi & Studio' }
		],
		includes: ['Unit Gitar Listrik', 'Gigbag', 'Kabel Jack & Strap'],
		stockQty: 5
	},
	{
		categorySlug: 'alat-musik',
		name: 'Saxophone',
		shortDescription: 'Saxophone elegan untuk penampilan solo wedding, gala dinner, jazz lounge, maupun properti panggung.',
		specs: [
			{ label: 'Tipe', value: 'Alto / Tenor Saxophone' },
			{ label: 'Aplikasi', value: 'Wedding, Jazz Performance & Properti Foto' }
		],
		includes: ['Unit Saxophone', 'Neck Strap', 'Hardcase'],
		requiresDeposit: true,
		stockQty: 3
	},
	{
		categorySlug: 'alat-musik',
		name: 'Stand Partitur',
		shortDescription: 'Penyangga buku not balok/lirik (music stand) lipat yang stabil untuk pemusik orkestra, paduan suara, dan vokalis.',
		specs: [
			{ label: 'Tipe', value: 'Folding Metal Music Stand' },
			{ label: 'Pengaturan', value: 'Tinggi & kemiringan dapat disesuaikan' }
		],
		includes: ['1 Unit Stand Partitur'],
		stockQty: 12
	},

	// =========================================================================
	// 7. KENDARAAN & TRANSPORTASI (3 item)
	// =========================================================================
	{
		categorySlug: 'kendaraan-transportasi',
		name: 'Hiace Premio',
		shortDescription: 'Minibus mewah Toyota Hiace Premio berkapasitas besar untuk rombongan wisata, tamu VIP, ziarah, dan dinas kantor.',
		description: `Toyota Hiace Premio menawarkan kabin lega, suspensi empuk, dan AC merata hingga baris belakang untuk kenyamanan perjalanan rombongan.\n\nCocok untuk rombongan keluarga, outing perusahaan, antar-jemput bandara, hingga perjalanan antar-kota DKI–Jabar–Jateng–DIY.`,
		specs: [
			{ label: 'Armada', value: 'Toyota Hiace Premio' },
			{ label: 'Kapasitas', value: 'Hingga 11–14 Penumpang' },
			{ label: 'Kenyamanan', value: 'Kabin luas, AC dingin & bagasi lega' }
		],
		includes: ['Unit Hiace Premio terawat', 'Opsi dengan Driver (hubungi CS)'],
		requiresDeposit: true,
		stockQty: 3,
		isFeatured: true
	},
	{
		categorySlug: 'kendaraan-transportasi',
		name: 'Mobil (Veloz, Xpander, Innova Zenix, Wuling EV)',
		shortDescription: 'Pilihan mobil keluarga, MPV eksekutif, hingga mobil listrik Wuling EV yang bersih dan siap jalan.',
		description: `Tersedia beragam armada mobil terbaru dan terawat sesuai kebutuhan perjalanan Anda: Toyota Veloz, Mitsubishi Xpander, Toyota Innova Zenix, hingga Wuling Air EV / Binguo EV yang irit untuk mobilitas dalam kota.\n\nHubungi CS untuk ketersediaan unit spesifik, pilihan lepas kunci / dengan driver, serta syarat verifikasi dokumen.`,
		specs: [
			{ label: 'Pilihan Armada', value: 'Veloz, Xpander, Innova Zenix, Wuling EV' },
			{ label: 'Transmisi', value: 'Matic / Otomatis nyaman' },
			{ label: 'Opsi Layanan', value: 'Harian, Mingguan, Lepas Kunci / Driver' }
		],
		includes: ['Unit Mobil Bersih & Servis Rutin', 'STNK Aktif'],
		variants: ['Toyota Veloz', 'Mitsubishi Xpander', 'Toyota Innova Zenix', 'Wuling EV'],
		requiresDeposit: true,
		stockQty: 8,
		isFeatured: true
	},
	{
		categorySlug: 'kendaraan-transportasi',
		name: 'Motor (Beat, Scoopy, Vario, PCX, NMAX, XMAX, Vespa)',
		shortDescription: 'Sewa motor matic harian & mingguan — mulai dari Beat, Scoopy, Vario 150/160, PCX, NMAX, XMAX hingga Vespa.',
		description: `Solusi mobilitas gesit untuk wisata, kunjungan kerja, operasional lapangan, atau kebutuhan harian selama berada di DKI, Jabar, Jateng, maupun DIY.\n\nTersedia pilihan lengkap dari skutik irit harian hingga maxi-scooter dan Vespa bergaya retro.`,
		specs: [
			{ label: 'Pilihan Unit', value: 'Beat, Scoopy, Vario 150/160, PCX, NMAX, XMAX, Vespa' },
			{ label: 'Kelengkapan', value: 'Helm & Jas Hujan (sesuai permintaan)' },
			{ label: 'Layanan', value: 'Antar-jemput lokasi atau ambil di kios' }
		],
		includes: ['Unit Motor Terawat', '2 Helm SNI', 'STNK Aktif'],
		variants: ['Honda Beat', 'Honda Scoopy', 'Honda Vario 150', 'Honda Vario 160', 'Honda PCX', 'Yamaha NMAX', 'Yamaha XMAX', 'Vespa Matic'],
		requiresDeposit: true,
		stockQty: 15
	},

	// =========================================================================
	// 8. MAINAN & PERLENGKAPAN ANAK (11 item)
	// =========================================================================
	...[
		{ name: 'Mainan Anak (Jumperoo)', short: 'Baby Jumperoo interaktif dengan musik & mainan gantung untuk melatih motorik kaki si kecil.', age: '± 4–12 bulan', featured: false },
		{ name: 'Mainan Anak (Around We Go)', short: 'Meja aktivitas keliling 360° Around We Go untuk melatih keseimbangan & koordinasi bayi belajar jalan.', age: '± 6–18 bulan', featured: false },
		{ name: 'Mainan Anak (Bouncer)', short: 'Kursi goyang bouncer empuk & ergonomis untuk menenangkan bayi saat bersantai atau makan.', age: 'Newborn – 12 bulan', featured: false },
		{ name: 'Mainan Anak (Car Seat)', short: 'Baby car seat standar keamanan untuk perjalanan mobil jauh/mudik yang lebih aman dan nyaman bagi buah hati.', age: 'Bayi – Balita', featured: false },
		{ name: 'Mainan Anak (Ergobaby)', short: 'Gendongan ergonomis Ergobaby penopang pinggul M-shape yang nyaman dipakai jalan-jalan lama.', age: 'Bayi – Balita', featured: false },
		{ name: 'Mainan Anak (Mobil Aki)', short: 'Mobil mainan bertenaga aki lengkap dengan remote control orang tua untuk pesta ulang tahun & bermain.', age: '2 – 6 tahun', featured: false },
		{ name: 'Mainan Anak (Motor Aki)', short: 'Motor mainan listrik bertenaga aki yang aman & stabil untuk aktivitas bermain seru anak di rumah.', age: '2 – 5 tahun', featured: false },
		{ name: 'Mainan Anak (Perosotan)', short: 'Perosotan anak plastik tebal ramah anak untuk play corner di rumah, arisan keluarga, maupun ulang tahun.', age: '1,5 – 5 tahun', featured: false },
		{ name: 'Mainan Anak (Push Bike)', short: 'Sepeda keseimbangan (balance bike / push bike) ringan untuk melatih keseimbangan anak sebelum sepeda pedal.', age: '2 – 5 tahun', featured: false },
		{ name: 'Mainan Anak (Stroller)', short: 'Kereta dorong bayi (stroller) lipat ringkas dan higienis — praktis untuk liburan, mall, dan mudik.', age: 'Newborn – 4 tahun', featured: true },
		{ name: 'Mainan Anak (Trampoline)', short: 'Trampoline anak dengan jaring pengaman untuk energi positif bermain di acara ulang tahun atau rumah.', age: '3 – 8 tahun', featured: false }
	].map((kid) => ({
		categorySlug: 'mainan-perlengkapan-anak',
		name: kid.name,
		shortDescription: kid.short,
		description: `${kid.short}\n\nSeluruh perlengkapan dan mainan anak di Adasewa.id dibersihkan dan disanitasi sebelum dikirim sehingga higienis serta aman untuk buah hati Anda. Hemat tanpa perlu membeli mahal untuk masa pakai yang singkat.`,
		specs: [
			{ label: 'Rekomendasi Usia', value: kid.age },
			{ label: 'Kebersihan', value: 'Dibersihkan & disanitasi sebelum serah terima' },
			{ label: 'Layanan', value: 'Sewa harian / mingguan / bulanan' }
		],
		includes: [`1 Unit ${kid.name.replace('Mainan Anak (', '').replace(')', '')} bersih & siap pakai`],
		stockQty: 5,
		isFeatured: kid.featured
	})),

	// =========================================================================
	// 9. ALAT CAMPING & OUTDOOR (3 item)
	// =========================================================================
	{
		categorySlug: 'camping-outdoor',
		name: 'Alat Camping (Sepatu Hiking Size 38–45)',
		shortDescription: 'Sepatu gunung/hiking anti-slip dan nyaman di medan terjal, tersedia ukuran lengkap dari size 38 hingga 45.',
		specs: [
			{ label: 'Pilihan Ukuran', value: 'Size 38 – 45' },
			{ label: 'Fitur', value: 'Outsole grip kuat & pelindung pergelangan' },
			{ label: 'Kondisi', value: 'Dicuci bersih & kering siap pakai' }
		],
		includes: ['1 Pasang Sepatu Hiking sesuai ukuran pilihan'],
		variants: ['Size 38', 'Size 39', 'Size 40', 'Size 41', 'Size 42', 'Size 43', 'Size 44', 'Size 45'],
		stockQty: 16
	},
	{
		categorySlug: 'camping-outdoor',
		name: 'Alat Camping (Tas Carrier 35–85 Liter)',
		shortDescription: 'Tas gunung carrier kapasitas 35L hingga 85L dengan backsystem ergonomis untuk tek-tok maupun pendakian multi-hari.',
		specs: [
			{ label: 'Pilihan Kapasitas', value: '35L, 45L, 55L, 60L, 70L, 85L' },
			{ label: 'Fitur', value: 'Backsystem empuk, hip belt & rain cover' }
		],
		includes: ['Unit Tas Carrier', 'Rain Cover'],
		variants: ['35–45 Liter', '50–60 Liter', '65–75 Liter', '80–85 Liter'],
		stockQty: 12
	},
	{
		categorySlug: 'camping-outdoor',
		name: 'Alat Camping (Tenda Kapasitas 4–10 Orang)',
		shortDescription: 'Tenda dome double-layer tahan hujan kapasitas 4 hingga 10 orang untuk camping keluarga, kampus, dan makrab.',
		specs: [
			{ label: 'Pilihan Kapasitas', value: '4, 6, 8 hingga 10 Orang' },
			{ label: 'Proteksi', value: 'Double-layer waterproof + flysheet' }
		],
		includes: ['Inner & Flysheet Tenda', 'Frame Penyangga', 'Pasak & Tali', 'Tas Tenda'],
		variants: ['Kapasitas 4 Orang', 'Kapasitas 6 Orang', 'Kapasitas 8 Orang', 'Kapasitas 10 Orang'],
		stockQty: 15,
		isFeatured: true
	},

	// =========================================================================
	// 10. PERLENGKAPAN WISUDA (3 item)
	// =========================================================================
	...[
		{ level: 'S1', desc: 'Set lengkap toga wisuda jenjang Sarjana (S1) — jubah, topi toga, dan samir/kalung rapi siap pakai.', featured: true },
		{ level: 'S2', desc: 'Set lengkap toga wisuda jenjang Magister (S2) yang rapi dan bersih untuk upacara kelulusan maupun foto studio.', featured: false },
		{ level: 'S3', desc: 'Set lengkap toga wisuda jenjang Doktor (S3) berkualitas premium untuk sidang promosi doktor dan wisuda.', featured: false }
	].map((tg) => ({
		categorySlug: 'wisuda-toga',
		name: `Toga Wisuda ${tg.level}`,
		shortDescription: tg.desc,
		description: `${tg.desc}\n\nSetiap set toga dicuci dan disetrika rapi sebelum diserahkan. Tersedia pilihan ukuran S hingga XXL, cocok untuk pemesanan individu maupun rombongan satu angkatan/fakultas.`,
		specs: [
			{ label: 'Jenjang', value: `Wisuda ${tg.level}` },
			{ label: 'Pilihan Ukuran', value: 'S, M, L, XL, XXL' },
			{ label: 'Kondisi', value: 'Laundry bersih & siap pakai' }
		],
		includes: [`Jubah Toga ${tg.level}`, 'Topi Toga', 'Samir / Slempang (sesuai stok)'],
		variants: ['Size S', 'Size M', 'Size L', 'Size XL', 'Size XXL'],
		stockQty: 30,
		isFeatured: tg.featured
	}))
];

function getReferencePriceBySlug(slug: string): number {
	const exact: Record<string, number> = {
		'proyektor-2600-lumens': 100000,
		'proyektor-2700-lumens': 110000,
		'proyektor-2800-lumens': 120000,
		'proyektor-3000-lumens': 135000,
		'proyektor-3200-lumens': 150000,
		'proyektor-3300-lumens': 160000,
		'proyektor-3500-lumens': 175000,
		'proyektor-3600-lumens': 190000,
		'proyektor-3800-lumens': 225000,
		'proyektor-4200-lumens': 275000,
		'proyektor-5500-lumens': 450000,
		'proyektor-10-000-lumens': 1500000,
		'screen-proyektor-71-inch': 50000,
		'screen-proyektor-84-inch': 75000,
		'screen-proyektor-94-inch': 100000,
		'stand-proyektor': 35000,
		'tv-led-32-inch': 175000,
		'tv-led-42-inch': 250000,
		'tv-led-55-inch': 400000,
		'tv-led-65-inch': 600000,
		'tv-led-75-inch': 900000,
		'tv-led-85-inch': 1250000,
		'stand-tv-led': 75000,
		'videotron-1-8': 1500000,
		'videotron-2-5': 1200000,
		'pointer-presentasi': 35000,
		'kabel-hdmi-20-m': 40000,
		'kabel-hdmi-25-m': 50000,
		'kabel-hdmi-30-m': 60000,
		'kabel-hdmi-50-m': 90000,
		'kabel-vga-20-m': 35000,
		'vga-converter': 25000,
		'zoom-pro': 50000,
		'sound-system-1000-watt': 350000,
		'sound-system-2000-watt': 550000,
		'sound-system-3000-watt': 750000,
		'sound-system-4000-watt': 1000000,
		'sound-system-5000-watt': 1250000,
		'sound-system-10000-watt': 2500000,
		'sound-system-12000-watt': 3000000,
		'sound-system-15000-watt': 4000000,
		'sound-system-20000-watt': 5500000,
		'sound-portable-12-inch': 150000,
		'sound-portable-15-inch': 200000,
		'mixer-16-channel': 250000,
		'sound-card': 125000,
		'mic-kabel': 30000,
		'mic-wireless': 75000,
		'stand-mic': 25000,
		'stand-mic-table': 20000,
		'stand-sound': 35000,
		'megaphone-toa': 50000,
		'handy-talkie-icom-v80': 35000,
		'handy-talkie-weirwei': 25000,
		'camcorder-sony-nx100': 350000,
		'gopro-hero-3-10': 125000,
		drone: 450000,
		'flash-sb-nikon-kamera': 75000,
		'tripod-kamera': 50000,
		'paket-streaming-2-kamera': 1500000,
		'paket-streaming-3-kamera': 2000000,
		'paket-streaming-4-kamera': 2750000,
		'paket-streaming-5-kamera': 3500000,
		photobooth: 1500000,
		'mirror-booth': 2250000,
		'video-booth-360': 2000000,
		'iphone-12-pro-max': 175000,
		'iphone-13-pro-max': 225000,
		'iphone-14-pro-max': 275000,
		'iphone-15-pro-max': 325000,
		'iphone-16-pro-max': 375000,
		'iphone-17-pro-max': 450000,
		'laptop-rog-flow': 275000,
		'laptop-rog-strix': 300000,
		'laptop-rog-zephyrus': 325000,
		'playstation-3': 65000,
		'playstation-4': 100000,
		'playstation-5': 175000,
		'mesin-fotokopi-canon': 350000,
		'lighting-beam-230w': 250000,
		'lighting-follow-spot': 300000,
		'lighting-laser-4-eye-rgb': 150000,
		'lighting-parled-rgb': 75000,
		'lighting-pro-set': 1500000,
		'panggung-6m-10m': 3500000,
		'backdrop-lamaran': 650000,
		'smoke-gun': 150000,
		'kursi-futura': 15000,
		'roll-top-pemanas-prasmanan': 75000,
		scaffolding: 50000,
		'genset-10-000-watt': 1250000,
		'genset-15-000-watt': 1750000,
		'genset-20-000-watt': 2250000,
		'kabel-roll-25m': 35000,
		'kabel-roll-50m': 55000,
		'ac-portable': 250000,
		'blower-kipas-embun-misty-fan-krisbow': 200000,
		'air-purifier': 75000,
		'water-purifier': 85000,
		dispenser: 50000,
		'kompor-portable': 25000,
		'tangga-lipat-4m': 50000,
		'trolley-barang-krisbow': 45000,
		'alat-dj': 450000,
		'ampli-gitar': 125000,
		'bass-listrik': 125000,
		biola: 75000,
		cajon: 65000,
		'drum-elektrik': 350000,
		'gitar-akustik': 75000,
		'gitar-listrik': 100000,
		saxophone: 200000,
		'stand-partitur': 25000,
		'hiace-premio': 1350000,
		'mainan-anak-jumperoo': 45000,
		'mainan-anak-around-we-go': 50000,
		'mainan-anak-bouncer': 30000,
		'mainan-anak-car-seat': 40000,
		'mainan-anak-ergobaby': 30000,
		'mainan-anak-mobil-aki': 75000,
		'mainan-anak-motor-aki': 60000,
		'mainan-anak-perosotan': 50000,
		'mainan-anak-push-bike': 35000,
		'mainan-anak-stroller': 45000,
		'mainan-anak-trampoline': 75000,
		'alat-camping-sepatu-hiking-size-38-45': 30000,
		'alat-camping-tas-carrier-35-85-liter': 35000,
		'alat-camping-tenda-kapasitas-4-10-orang': 60000,
		'toga-wisuda-s1': 65000,
		'toga-wisuda-s2': 80000,
		'toga-wisuda-s3': 100000
	};

	if (slug in exact) return exact[slug]!;
	if (slug.startsWith('kamera-mirrorless')) return 175000;
	if (slug.startsWith('kamera-dslr')) return 200000;
	if (slug.startsWith('mobil-')) return 375000;
	if (slug.startsWith('motor-')) return 90000;
	return 100000;
}

export const ADASEWA_ITEMS: SeedItemDef[] = RAW_ITEMS.map((item, idx) => {
	const slug = slugifyItem(item.name);
	return {
		categorySlug: item.categorySlug,
		name: item.name,
		slug,
		shortDescription: item.shortDescription,
		description:
			item.description ??
			`${item.shortDescription}\n\nUnit selalu diperiksa kelayakan dan fungsinya sebelum serah terima. Tersedia layanan antar-jemput (delivery) untuk wilayah DKI Jakarta, Jawa Barat, Jawa Tengah, dan D.I. Yogyakarta, atau ambil langsung di kios Adasewa.id.`,
		specs: item.specs,
		includes: item.includes,
		variants: item.variants ?? [],
		pricePerDay: getReferencePriceBySlug(slug),
		unitLabel: item.unitLabel ?? 'hari',
		minDurationDays: 1,
		stockQty: item.stockQty ?? 3,
		requiresDeposit: item.requiresDeposit ?? false,
		isFeatured: item.isFeatured ?? false,
		sortOrder: idx + 1
	};
});
