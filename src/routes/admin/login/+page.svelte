<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let form: ActionData;
</script>

<svelte:head>
	<title>관리자 로그인 - AI Saju Master</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
	<Card class="w-full max-w-md shadow-2xl">
		<CardHeader>
			<CardTitle class="text-3xl text-center">🔐 관리자 로그인</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="space-y-6">
				{#if form?.error}
					<div class="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
						❌ {form.error}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="password">비밀번호</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="관리자 비밀번호를 입력하세요"
						required
						class="text-lg"
					/>
				</div>

				<Button type="submit" class="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600">
					로그인
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
