<script lang="ts">
	import InvoiceSheet from '#lib/components/invoice/InvoiceSheet.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Invoice {data.order.orderCode} — {data.settings.companyName}</title>
</svelte:head>

<div class="min-h-screen bg-black py-8 text-white print:min-h-0 print:bg-white print:py-0 print:text-neutral-950">
	<!-- Toolbar Aksi (Hanya tampil di layar, hilang saat dicetak) -->
	<div class="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
		<a
			href={data.backHref}
			class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#0c0c0f] px-4 py-2 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
		>
			← Kembali
		</a>

		<div class="flex items-center gap-3">
			<span class="hidden text-xs font-medium text-neutral-400 sm:inline">Format 1 Lembar A4</span>
			<button
				type="button"
				onclick={() => window.print()}
				class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-black transition hover:bg-neutral-200"
			>
				Cetak / Simpan PDF
			</button>
		</div>
	</div>

	<!-- Lembar Invoice A4 (Tetap putih bersih untuk cetak) -->
	<div
		class="mx-auto max-w-[210mm] rounded-[2rem] border border-white/15 bg-white p-8 text-neutral-950 shadow-2xl shadow-black/70 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
	>
		<InvoiceSheet settings={data.settings} order={data.order} items={data.items} />
	</div>
</div>
