<script>
	import '../app.css';
	
	let { children } = $props();
</script>

<svelte:head>
	<title>Ali Ahmad | Software Developer</title>
	<meta name="description" content="Portfolio of Ali Ahmad - Computer Science Student at NUST, H-12" />
</svelte:head>

{@render children()}
