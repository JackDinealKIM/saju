<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let data: PageData;
	export let form: ActionData;

	let copied = false;
	let copiedToken = '';

	async function copyToken(token: string) {
		try {
			await navigator.clipboard.writeText(`${$page.url.origin}/?invite=${token}`);
			copied = true;
			copiedToken = token;
			setTimeout(() => {
				copied = false;
				copiedToken = '';
			}, 2000);
		} catch (err) {
			console.error('복사 실패:', err);
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return '-';
		return new Date(date).toLocaleString('ko-KR');
	}
</script>

<svelte:head>
	<title>관리자 페이지 - 초대 링크 관리</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4">
	<div class="max-w-7xl mx-auto space-y-6">
		<!-- 헤더 -->
		<div class="text-center py-8">
			<h1 class="text-5xl font-bold text-purple-800 mb-2">🔧 관리자 페이지</h1>
			<p class="text-xl text-gray-600">초대 링크 생성 및 관리</p>
		</div>

		<!-- 성공 메시지 -->
		{#if form?.success}
			<div class="bg-green-50 border-2 border-green-300 rounded-lg p-6">
				<h3 class="text-xl font-bold text-green-700 mb-4">✅ {form.message}</h3>
				{#if form.tokens && form.tokens.length > 0}
					<div class="space-y-2">
						{#each form.tokens as token}
							<div class="bg-white rounded-lg p-4 flex items-center justify-between">
								<code class="text-sm text-purple-700 font-mono flex-1 break-all">
									{$page.url.origin}/?invite={token}
								</code>
								<Button
									variant="outline"
									size="sm"
									class="ml-4"
									on:click={() => copyToken(token)}
								>
									{#if copied && copiedToken === token}
										복사됨!
									{:else}
										복사
									{/if}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- 에러 메시지 -->
		{#if form?.error}
			<div class="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
				❌ {form.error}
			</div>
		{/if}

		<!-- 초대 링크 생성 -->
		<Card class="shadow-xl border-4 border-purple-200">
			<CardHeader>
				<CardTitle class="text-3xl">🎁 새 초대 링크 생성</CardTitle>
			</CardHeader>
			<CardContent>
				<form method="POST" action="?/createToken" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="count">생성 개수</Label>
							<Input
								id="count"
								name="count"
								type="number"
								min="1"
								max="100"
								value="1"
								class="text-lg"
							/>
						</div>

						<div class="space-y-2">
							<Label for="memo">메모 (선택)</Label>
							<Input
								id="memo"
								name="memo"
								type="text"
								placeholder="예: 홍길동님 결제"
								class="text-lg"
							/>
						</div>
					</div>

					<Button type="submit" class="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600">
						초대 링크 생성하기
					</Button>
				</form>
			</CardContent>
		</Card>

		<!-- 초대 링크 목록 -->
		<Card class="shadow-xl border-4 border-blue-200">
			<CardHeader>
				<CardTitle class="text-3xl">📋 초대 링크 목록</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="bg-purple-100">
							<tr>
								<th class="p-3">토큰</th>
								<th class="p-3">메모</th>
								<th class="p-3">상태</th>
								<th class="p-3">사용자</th>
								<th class="p-3">생성일</th>
								<th class="p-3">사용일</th>
								<th class="p-3">액션</th>
							</tr>
						</thead>
						<tbody>
							{#each data.tokens as token}
								<tr class="border-b hover:bg-purple-50">
									<td class="p-3">
										<code class="text-xs bg-gray-100 px-2 py-1 rounded">
											{token.token.substring(0, 8)}...
										</code>
									</td>
									<td class="p-3">{token.memo || '-'}</td>
									<td class="p-3">
										{#if token.isUsed}
											<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
												✓ 사용됨
											</span>
										{:else}
											<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
												○ 미사용
											</span>
										{/if}
									</td>
									<td class="p-3">
										{#if token.sajuLog}
											{token.sajuLog.name}
										{:else}
											-
										{/if}
									</td>
									<td class="p-3 text-sm text-gray-600">{formatDate(token.createdAt)}</td>
									<td class="p-3 text-sm text-gray-600">{formatDate(token.usedAt)}</td>
									<td class="p-3">
										<div class="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												on:click={() => copyToken(token.token)}
											>
												{#if copied && copiedToken === token.token}
													복사됨!
												{:else}
													복사
												{/if}
											</Button>
											{#if !token.isUsed}
												<form method="POST" action="?/deleteToken" use:enhance>
													<input type="hidden" name="tokenId" value={token.id} />
													<Button
														type="submit"
														variant="outline"
														size="sm"
														class="text-red-600 border-red-300 hover:bg-red-50"
													>
														삭제
													</Button>
												</form>
											{/if}
										</div>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="7" class="p-8 text-center text-gray-500">
										생성된 초대 링크가 없습니다.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
