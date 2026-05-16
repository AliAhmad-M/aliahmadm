<script>
	import '../app.css';
	
	let { children } = $props();
</script>

<svelte:head>
	<title>Ali Ahmad | Software Developer</title>
	<meta name="description" content="Portfolio of Ali Ahmad" />
</svelte:head>

{@render children()}
