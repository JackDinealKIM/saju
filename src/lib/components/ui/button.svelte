<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let variant: 'default' | 'secondary' | 'outline' = 'default';
	export let size: 'default' | 'sm' | 'lg' = 'default';
	export let disabled = false;

	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 py-1 text-xs',
		lg: 'h-12 px-6 py-3 text-base'
	};
</script>

<button
	{type}
	{disabled}
	class={cn(
		'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		sizes[size],
		variants[variant],
		className
	)}
	on:click
>
	<slot />
</button>
