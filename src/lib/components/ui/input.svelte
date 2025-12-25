<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
	export let type: string = 'text';
	export let value: string | number = '';
	export let placeholder: string = '';
	export let name: string = '';
	export let required: boolean = false;
	export let min: number | string | undefined = undefined;
	export let max: number | string | undefined = undefined;
	export let disabled: boolean = false;
</script>

<input
	{type}
	{name}
	{placeholder}
	{required}
	{disabled}
	{min}
	{max}
	bind:value
	class={cn(
		'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	on:input
	on:change
	on:blur
/>
