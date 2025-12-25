<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatDate(date: Date): string {
		const d = new Date(date);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) return `${diffMins}분 전`;
		if (diffHours < 24) return `${diffHours}시간 전`;
		if (diffDays < 7) return `${diffDays}일 전`;

		return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
	}
</script>

<svelte:head>
	<title>분석 히스토리 - AI Saju Master</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- 헤더 -->
		<div class="text-center mb-12 animate-bounce-in">
			<div class="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
				<span class="text-6xl">📜</span>
			</div>
			<h1 class="text-6xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
				분석 히스토리
			</h1>
			<p class="text-xl text-gray-600">최근 분석한 사주 기록</p>
		</div>

		{#if data.error}
			<Card class="shadow-2xl border-4 border-orange-200 mb-8">
				<CardContent>
					<div class="p-8 text-center">
						<div class="text-6xl mb-4">⚠️</div>
						<h2 class="text-2xl font-bold mb-4 text-orange-700">{data.error}</h2>
						<p class="text-gray-600 mb-6">
							데이터베이스 권한 설정이 필요합니다.<br />
							<code class="bg-gray-100 px-2 py-1 rounded">001-db-permissions.sql</code> 파일을 postgres 사용자로 실행해주세요.
						</p>
						<Button variant="default" on:click={() => window.location.href = '/'}>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
							메인으로 돌아가기
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else if data.history.length === 0}
			<Card class="shadow-2xl border-4 border-gray-200">
				<CardContent>
					<div class="p-12 text-center">
						<div class="text-6xl mb-4">📭</div>
						<h2 class="text-2xl font-bold mb-4 text-gray-700">아직 분석 기록이 없어요</h2>
						<p class="text-gray-600 mb-6">사주 분석을 시작해보세요!</p>
						<Button variant="default" class="bg-gradient-to-r from-purple-600 to-pink-600" on:click={() => window.location.href = '/'}>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							사주 분석하러 가기
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-4 animate-slide-up">
				{#each data.history as item, index}
					<Card class="shadow-lg border-2 border-purple-200 hover:shadow-2xl transition-all animate-slide-in" style="animation-delay: {index * 0.05}s">
						<CardContent>
							<div class="p-4">
								<div class="flex items-start justify-between mb-4">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<span class="text-3xl">{item.gender === 'male' ? '👦' : '👧'}</span>
											<h3 class="text-2xl font-bold">{item.name}님</h3>
											<span class="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
										</div>
										<p class="text-gray-600">{item.birthDate}</p>
									</div>
									{#if item.shareId}
										<Button
											variant="outline"
											size="sm"
											on:click={() => window.location.href = `/share/${item.shareId}`}
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
											보기
										</Button>
									{/if}
								</div>

								<!-- 사주 팔자 미리보기 -->
								<div class="grid grid-cols-4 gap-2">
									{#each [
										{ label: '년주', value: item.saju.yearPillar, color: 'from-red-400 to-orange-400' },
										{ label: '월주', value: item.saju.monthPillar, color: 'from-yellow-400 to-green-400' },
										{ label: '일주', value: item.saju.dayPillar, color: 'from-blue-400 to-purple-400' },
										{ label: '시주', value: item.saju.timePillar || '미상', color: 'from-pink-400 to-violet-400' }
									] as pillar}
										<div class="text-center p-3 bg-gradient-to-br {pillar.color} rounded-lg">
											<div class="text-xs text-white/70 font-semibold">{pillar.label}</div>
											<div class="text-xl font-bold text-white">{pillar.value}</div>
										</div>
									{/each}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- 메인으로 돌아가기 버튼 -->
			<div class="text-center mt-8">
				<Button variant="outline" class="text-lg px-8 py-6" on:click={() => window.location.href = '/'}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					메인으로 돌아가기
				</Button>
			</div>
		{/if}

		<!-- 푸터 -->
		<div class="text-center mt-12 text-gray-600">
			<p class="text-lg">🤖 Powered by 쏘민</p>
		</div>
	</div>
</div>

<style>
	@keyframes bounce-in {
		0% {
			opacity: 0;
			transform: scale(0.3);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-bounce-in {
		animation: bounce-in 0.6s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 0.6s ease-out;
	}

	.animate-slide-in {
		animation: slide-in 0.4s ease-out forwards;
		opacity: 0;
	}
</style>
