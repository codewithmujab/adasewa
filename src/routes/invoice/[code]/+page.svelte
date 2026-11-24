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

<div class="min-h-screen bg-surface py-8 print:min-h-0 print:bg-white print:py-0">
	<!-- Toolbar Aksi (Hanya tampil di layar, hilang saat dicetak) -->
	<div class="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
		<a
			href={data.backHref}
			class="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
		>
			← Kembali
		</a>

		<div class="flex items-center gap-2">
			<span class="hidden text-xs text-neutral-500 sm:inline">Format 1 Lembar A4</span>
			<button
				type="button"
				onclick={() => window.print()}
				class="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
			>
				Cetak / Simpan PDF
			</button>
		</div>
	</div>

	<!-- Lembar Invoice A4 -->
	<div
		class="mx-auto max-w-[210mm] rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
	>
		<InvoiceSheet settings={data.settings} order={data.order} items={data.items} />
	</div>
</div>
