<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data: PageData;
	export let form: ActionData;

	let loading = false;
	let timeUnknown = false;
	let copied = false;

	const loadingMessages = [
		'하늘의 기운을 읽는 중...',
		'만세력을 펼치는 중...',
		'사주팔자를 계산하는 중...',
		'명리학자가 분석하는 중...',
		'운세를 풀이하는 중...'
	];

	let currentLoadingMessage = loadingMessages[0];

	function getRandomLoadingMessage() {
		return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
	}

	async function copyShareUrl() {
		if (form?.result?.shareId) {
			const shareUrl = `${$page.url.origin}/share/${form.result.shareId}`;
			try {
				await navigator.clipboard.writeText(shareUrl);
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 2000);
			} catch (err) {
				console.error('복사 실패:', err);
			}
		}
	}

	// 월별 운세 차트 그리기
	function drawMonthlyFortuneChart(canvas: HTMLCanvasElement, months: any[]) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const padding = 40;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		ctx.clearRect(0, 0, width, height);

		// 배경 그리드
		ctx.strokeStyle = '#e5e7eb';
		ctx.lineWidth = 1;
		for (let i = 0; i <= 4; i++) {
			const y = padding + (chartHeight / 4) * i;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		// Y축 레이블 (점수)
		ctx.fillStyle = '#6b7280';
		ctx.font = '12px sans-serif';
		ctx.textAlign = 'right';
		for (let i = 0; i <= 4; i++) {
			const score = 100 - (i * 25);
			const y = padding + (chartHeight / 4) * i;
			ctx.fillText(score.toString(), padding - 10, y + 4);
		}

		// 선 그래프 그리기
		const pointSpacing = chartWidth / (months.length - 1);

		// 그라데이션 배경
		const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
		gradient.addColorStop(0, 'rgba(167, 139, 250, 0.2)');
		gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');

		ctx.beginPath();
		months.forEach((month, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = month.score / 100;
			const y = height - padding - (chartHeight * scoreRatio);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.lineTo(width - padding, height - padding);
		ctx.lineTo(padding, height - padding);
		ctx.closePath();
		ctx.fillStyle = gradient;
		ctx.fill();

		// 선 그리기
		ctx.beginPath();
		months.forEach((month, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = month.score / 100;
			const y = height - padding - (chartHeight * scoreRatio);

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.strokeStyle = '#8b5cf6';
		ctx.lineWidth = 3;
		ctx.stroke();

		// 점과 레이블 그리기
		ctx.font = 'bold 12px sans-serif';
		ctx.textAlign = 'center';
		months.forEach((month, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = month.score / 100;
			const y = height - padding - (chartHeight * scoreRatio);

			// 점
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fillStyle = '#8b5cf6';
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.stroke();

			// 점수 표시
			ctx.fillStyle = '#1f2937';
			ctx.fillText(month.score.toString(), x, y - 15);

			// 기간 레이블
			ctx.fillStyle = '#6b7280';
			ctx.font = '11px sans-serif';
			ctx.fillText(month.period, x, height - padding + 20);
		});
	}

	// 인생 전체 운세 그래프 그리기
	function drawLifeFortuneChart(canvas: HTMLCanvasElement, decades: any[]) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const padding = 50;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		ctx.clearRect(0, 0, width, height);

		// 배경 그리드
		ctx.strokeStyle = '#e5e7eb';
		ctx.lineWidth = 1;
		for (let i = 0; i <= 5; i++) {
			const y = padding + (chartHeight / 5) * i;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		// Y축 레이블
		ctx.fillStyle = '#6b7280';
		ctx.font = '12px sans-serif';
		ctx.textAlign = 'right';
		for (let i = 0; i <= 5; i++) {
			const score = 100 - (i * 20);
			const y = padding + (chartHeight / 5) * i;
			ctx.fillText(score.toString(), padding - 10, y + 4);
		}

		// 막대 그래프 그리기
		const barWidth = chartWidth / decades.length;
		const barSpacing = 10;
		const actualBarWidth = barWidth - barSpacing;

		decades.forEach((decade, i) => {
			const x = padding + barWidth * i + barSpacing / 2;
			const scoreRatio = decade.score / 100;
			const barHeight = chartHeight * scoreRatio;
			const y = height - padding - barHeight;

			// 그라데이션
			const gradient = ctx.createLinearGradient(x, y, x, height - padding);
			const hue = 200 + (scoreRatio * 60); // 200(파랑) ~ 260(보라)
			gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
			gradient.addColorStop(1, `hsl(${hue}, 70%, 50%)`);

			// 막대
			ctx.fillStyle = gradient;
			ctx.fillRect(x, y, actualBarWidth, barHeight);

			// 테두리
			ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`;
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, actualBarWidth, barHeight);

			// 점수 표시
			ctx.fillStyle = '#1f2937';
			ctx.font = 'bold 12px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(decade.score.toString(), x + actualBarWidth / 2, y - 10);

			// 나이 레이블
			ctx.fillStyle = '#6b7280';
			ctx.font = '10px sans-serif';
			const ageText = decade.age.split('세')[0] + '세';
			ctx.save();
			ctx.translate(x + actualBarWidth / 2, height - padding + 15);
			ctx.rotate(-Math.PI / 6);
			ctx.fillText(ageText, 0, 0);
			ctx.restore();

			// 시기 레이블
			ctx.font = '9px sans-serif';
			ctx.fillText(decade.period, x + actualBarWidth / 2, height - padding + 30);
		});
	}

	onMount(() => {
		console.log('🎨 onMount 실행됨');
		console.log('📊 form?.result?.aiAnalysis:', form?.result?.aiAnalysis);

		if (form?.result?.aiAnalysis) {
			// 월별 운세 차트
			const monthlyCanvas = document.querySelector('#monthlyFortuneChart') as HTMLCanvasElement;
			console.log('🎯 monthlyCanvas:', monthlyCanvas);
			console.log('📅 yearFortune_2026:', form.result.aiAnalysis.yearFortune_2026);

			if (monthlyCanvas && form.result.aiAnalysis.yearFortune_2026?.months) {
				console.log('✅ 월별 차트 그리기 시작');
				drawMonthlyFortuneChart(monthlyCanvas, form.result.aiAnalysis.yearFortune_2026.months);
			} else {
				console.log('❌ 월별 차트 조건 실패:', {
					hasCanvas: !!monthlyCanvas,
					hasMonths: !!form.result.aiAnalysis.yearFortune_2026?.months
				});
			}

			// 인생 전체 차트
			const lifeCanvas = document.querySelector('#lifeFortuneChart') as HTMLCanvasElement;
			console.log('🎯 lifeCanvas:', lifeCanvas);
			console.log('🌈 lifeFortune:', form.result.aiAnalysis.lifeFortune);

			if (lifeCanvas && form.result.aiAnalysis.lifeFortune?.decades) {
				console.log('✅ 인생 차트 그리기 시작');
				drawLifeFortuneChart(lifeCanvas, form.result.aiAnalysis.lifeFortune.decades);
			} else {
				console.log('❌ 인생 차트 조건 실패:', {
					hasCanvas: !!lifeCanvas,
					hasDecades: !!form.result.aiAnalysis.lifeFortune?.decades
				});
			}
		} else {
			console.log('❌ form.result.aiAnalysis가 없음');
		}
	});
</script>

<svelte:head>
	<title>AI Saju Master - 사주팔자 분석</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- 헤더 -->
		<div class="text-center mb-12 animate-bounce-in">
			<div class="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
				<span class="text-6xl">🔮</span>
			</div>
			<h1 class="text-6xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
				AI 사주 Master
			</h1>
			<p class="text-xl text-gray-600">초등학생도 쉽게 이해하는 재미있는 사주 분석!</p>
		</div>

		{#if !form?.result}
			<!-- 입력 폼 -->
			<div class="max-w-2xl mx-auto animate-slide-up">
				<Card class="shadow-2xl border-4 border-purple-200">
					<CardHeader class="bg-gradient-to-r from-purple-100 to-pink-100">
						<CardTitle class="text-2xl">✨ 내 정보 입력하기</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							method="POST"
							action="?/analyze"
							use:enhance={() => {
								loading = true;
								currentLoadingMessage = getRandomLoadingMessage();
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
<!-- 초대 토큰 hidden field -->
<input type="hidden" name="inviteToken" value={data.inviteToken} />
							<div class="space-y-6">
								<div class="space-y-2">
									<Label _for="name" class="text-lg font-semibold">📝 이름</Label>
									<Input id="name" name="name" placeholder="홍길동" required class="text-lg p-6" />
								</div>

								<div class="space-y-2">
									<Label class="text-lg font-semibold">👤 성별</Label>
									<div class="flex gap-4">
										<label class="flex-1 cursor-pointer">
											<input type="radio" name="gender" value="male" required class="peer hidden" />
											<div class="p-4 border-2 rounded-lg text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50">
												<span class="text-3xl">👦</span>
												<p class="mt-2 font-semibold">남자</p>
											</div>
										</label>
										<label class="flex-1 cursor-pointer">
											<input type="radio" name="gender" value="female" required class="peer hidden" />
											<div class="p-4 border-2 rounded-lg text-center peer-checked:border-pink-500 peer-checked:bg-pink-50 hover:bg-gray-50">
												<span class="text-3xl">👧</span>
												<p class="mt-2 font-semibold">여자</p>
											</div>
										</label>
									</div>
								</div>

								<div class="space-y-2">
									<Label class="text-lg font-semibold">📅 달력 종류</Label>
									<div class="flex gap-4">
										<label class="flex-1 cursor-pointer">
											<input type="radio" name="calendarType" value="solar" required class="peer hidden" />
											<div class="p-4 border-2 rounded-lg text-center peer-checked:border-yellow-500 peer-checked:bg-yellow-50 hover:bg-gray-50">
												<span class="text-3xl">☀️</span>
												<p class="mt-2 font-semibold">양력</p>
											</div>
										</label>
										<label class="flex-1 cursor-pointer">
											<input type="radio" name="calendarType" value="lunar" required class="peer hidden" />
											<div class="p-4 border-2 rounded-lg text-center peer-checked:border-indigo-500 peer-checked:bg-indigo-50 hover:bg-gray-50">
												<span class="text-3xl">🌙</span>
												<p class="mt-2 font-semibold">음력</p>
											</div>
										</label>
									</div>
								</div>

								<div class="grid grid-cols-3 gap-4">
									<div class="space-y-2">
										<Label _for="year" class="font-semibold">년</Label>
										<Input id="year" name="year" type="number" placeholder="1990" min="1900" max="2100" required class="text-lg p-6" />
									</div>
									<div class="space-y-2">
										<Label _for="month" class="font-semibold">월</Label>
										<Input id="month" name="month" type="number" placeholder="5" min="1" max="12" required class="text-lg p-6" />
									</div>
									<div class="space-y-2">
										<Label _for="day" class="font-semibold">일</Label>
										<Input id="day" name="day" type="number" placeholder="15" min="1" max="31" required class="text-lg p-6" />
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label _for="hour" class="font-semibold">시</Label>
										<Input id="hour" name="hour" type="number" placeholder="14" min="0" max="23" disabled={timeUnknown} class="text-lg p-6" />
									</div>
									<div class="space-y-2">
										<Label _for="minute" class="font-semibold">분</Label>
										<Input id="minute" name="minute" type="number" placeholder="30" min="0" max="59" disabled={timeUnknown} class="text-lg p-6" />
									</div>
								</div>

								<label class="flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={timeUnknown} class="w-5 h-5" />
									<span class="text-sm">⏰ 태어난 시간을 모르겠어요</span>
								</label>

								{#if form?.error}
									<div class="p-4 bg-red-100 text-red-700 rounded-lg animate-shake font-semibold">
										⚠️ {form.error}
									</div>
								{/if}

								<Button type="submit" class="w-full text-xl py-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled={loading}>
									{#if loading}
										<span class="flex items-center gap-3 justify-center">
											<svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											{currentLoadingMessage}
										</span>
									{:else}
										🎯 내 운세 알아보기!
									{/if}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		{:else if data.existingResult}
		<!-- 기존 분석 결과 표시 -->
		{@const analysis = data.existingResult.aiAnalysis}
		<div class="space-y-8 animate-slide-up">
			<!-- 안내 메시지 -->
			<Card class="shadow-xl border-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
				<CardContent class="p-6 text-center">
					<h3 class="text-2xl font-bold text-blue-700 mb-2">🎉 이전에 분석한 결과가 있습니다!</h3>
					<p class="text-gray-600">초대 링크로 이미 사주 분석을 받으셨습니다. 아래에서 결과를 확인하세요.</p>
				</CardContent>
			</Card>

		<!-- 결과 표시 - 구조화된 JSON -->

				<!-- 사주 정보 카드 -->
				<Card class="shadow-2xl border-4 border-purple-200">
					<CardHeader class="bg-gradient-to-r from-purple-100 to-pink-100">
						<CardTitle class="text-3xl">{data.existingResult.name}님의 사주팔자</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-4 gap-4 mb-6">
							{#each [
								{ label: '년주', value: data.existingResult.saju.yearPillar, color: 'from-red-400 to-orange-400' },
								{ label: '월주', value: data.existingResult.saju.monthPillar, color: 'from-yellow-400 to-green-400' },
								{ label: '일주', value: data.existingResult.saju.dayPillar, color: 'from-blue-400 to-purple-400' },
								{ label: '시주', value: data.existingResult.saju.timePillar || '미상', color: 'from-pink-400 to-violet-400' }
							] as pillar}
								<div class="text-center p-6 bg-gradient-to-br {pillar.color} rounded-xl shadow-lg transform hover:scale-110 transition-all">
									<div class="text-sm text-white/80 font-semibold">{pillar.label}</div>
									<div class="text-4xl font-bold text-white mt-2">{pillar.value}</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- 성격 분석 -->
				{#if analysis.personality}
					<Card class="shadow-2xl border-4 border-yellow-200">
						<CardHeader class="bg-gradient-to-r from-yellow-100 to-orange-100">
							<CardTitle class="text-3xl">{analysis.personality.emoji} {analysis.personality.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-6 p-6 bg-yellow-50 rounded-xl">
								<p class="text-2xl font-bold text-center">{analysis.personality.summary}</p>
							</div>

							<div class="grid md:grid-cols-2 gap-6 mb-6">
								<div>
									<h4 class="text-xl font-bold mb-3 text-green-600">👍 나의 장점</h4>
									<ul class="space-y-2">
										{#each analysis.personality.strengths as strength}
											<li class="p-3 bg-green-50 rounded-lg border-l-4 border-green-500 animate-slide-in">
												✨ {strength}
											</li>
										{/each}
									</ul>
								</div>
								<div>
									<h4 class="text-xl font-bold mb-3 text-orange-600">⚠️ 주의할 점</h4>
									<ul class="space-y-2">
										{#each analysis.personality.weaknesses as weakness}
											<li class="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500 animate-slide-in">
												💡 {weakness}
											</li>
										{/each}
									</ul>
								</div>
							</div>

							<!-- 성격 특징 카드 -->
							<div class="grid md:grid-cols-3 gap-4">
								{#each analysis.personality.traits as trait}
									<div class="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
										<h5 class="font-bold text-lg mb-2">{trait.trait}</h5>
										<p class="text-sm text-gray-700">{trait.description}</p>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 직업과 재물운 -->
				{#if analysis.career}
					<Card class="shadow-2xl border-4 border-green-200">
						<CardHeader class="bg-gradient-to-r from-green-100 to-teal-100">
							<CardTitle class="text-3xl">{analysis.career.emoji} {analysis.career.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-6 p-6 bg-green-50 rounded-xl">
								<p class="text-xl font-bold text-center">{analysis.career.summary}</p>
							</div>

							<div class="mb-6">
								<h4 class="text-2xl font-bold mb-4 text-green-700">💼 어울리는 직업</h4>
								<div class="grid md:grid-cols-2 gap-4">
									{#each analysis.career.suitableJobs as job}
										<div class="p-5 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-300">
											<h5 class="font-bold text-lg mb-2 text-green-800">{job.category}</h5>
											<div class="flex flex-wrap gap-2">
												{#each job.examples as example}
													<span class="px-3 py-1 bg-white rounded-full text-sm border border-green-300">{example}</span>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>

							<div>
								<h4 class="text-2xl font-bold mb-4 text-green-700">💰 돈 모으는 비법</h4>
								<ul class="space-y-3">
									{#each analysis.career.moneyTips as tip}
										<li class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 flex items-center gap-3">
											<span class="text-2xl">💎</span>
											<span class="text-lg">{tip}</span>
										</li>
									{/each}
								</ul>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 인간관계와 사랑 -->
				{#if analysis.relationships}
					<Card class="shadow-2xl border-4 border-pink-200">
						<CardHeader class="bg-gradient-to-r from-pink-100 to-rose-100">
							<CardTitle class="text-3xl">{analysis.relationships.emoji} {analysis.relationships.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-6">
								<div class="p-6 bg-pink-50 rounded-xl">
									<p class="text-xl font-bold text-center">{analysis.relationships.summary}</p>
								</div>

								<div class="grid md:grid-cols-2 gap-6">
									<div class="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
										<h5 class="font-bold text-xl mb-3 text-pink-700">💕 연애 스타일</h5>
										<p class="text-lg">{analysis.relationships.loveStyle}</p>
									</div>
									<div class="p-5 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl">
										<h5 class="font-bold text-xl mb-3 text-rose-700">💑 이상형</h5>
										<p class="text-lg">{analysis.relationships.idealPartner}</p>
									</div>
								</div>

								<div>
									<h5 class="font-bold text-xl mb-3 text-pink-700">🤝 친구 사귀기 팁</h5>
									<ul class="space-y-2">
										{#each analysis.relationships.friendshipTips as tip}
											<li class="p-3 bg-pink-50 rounded-lg flex items-center gap-3">
												<span class="text-xl">⭐</span>
												<span>{tip}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 2026년 신년 운세 -->
				{#if analysis.yearFortune_2026}
					<Card class="shadow-2xl border-4 border-indigo-200">
						<CardHeader class="bg-gradient-to-r from-indigo-100 to-purple-100">
							<CardTitle class="text-3xl">{analysis.yearFortune_2026.emoji} {analysis.yearFortune_2026.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-6 p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl">
								<p class="text-2xl font-bold text-center">{analysis.yearFortune_2026.overall}</p>
							</div>

							<!-- 월별 운세 차트 -->
							<div class="mb-6 p-6 bg-white rounded-xl shadow-inner">
								<h4 class="text-2xl font-bold mb-4 text-center text-indigo-700">📊 월별 운세 그래프</h4>
								<div class="flex justify-center">
									<canvas id="monthlyFortuneChart" width="800" height="300" class="max-w-full"></canvas>
								</div>
							</div>

							<!-- 월별 운세 -->
							<div class="grid md:grid-cols-2 gap-4 mb-6">
								{#each analysis.yearFortune_2026.months as month}
									<div class="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300">
										<h5 class="font-bold text-xl mb-2 text-indigo-700">{month.period}</h5>
										<p class="mb-3">{month.fortune}</p>
										<div class="flex items-center gap-2 mb-2">
											<span class="font-semibold">행운의 색:</span>
											<span class="px-3 py-1 bg-white rounded-full text-sm">{month.luckyColor}</span>
										</div>
										<div class="p-2 bg-yellow-50 rounded text-sm">
											💡 {month.advice}
										</div>
									</div>
								{/each}
							</div>

							<!-- 행운의 숫자 -->
							<div class="grid md:grid-cols-2 gap-6">
								<div class="p-5 bg-green-50 rounded-xl">
									<h5 class="font-bold text-xl mb-3 text-green-700">🍀 행운의 숫자</h5>
									<div class="flex gap-3">
										{#each analysis.yearFortune_2026.luckyNumbers as num}
											<div class="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
												{num}
											</div>
										{/each}
									</div>
								</div>
								<div class="p-5 bg-orange-50 rounded-xl">
									<h5 class="font-bold text-xl mb-3 text-orange-700">⚠️ 조심할 시기</h5>
									<ul class="space-y-2">
										{#each analysis.yearFortune_2026.avoidDates as date}
											<li class="text-lg">🔸 {date}</li>
										{/each}
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 인생 전체 운세 -->
				{#if analysis.lifeFortune}
					<Card class="shadow-2xl border-4 border-cyan-200">
						<CardHeader class="bg-gradient-to-r from-cyan-100 to-blue-100">
							<CardTitle class="text-3xl">{analysis.lifeFortune.emoji} {analysis.lifeFortune.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-6 p-6 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl">
								<p class="text-xl font-bold text-center">{analysis.lifeFortune.summary}</p>
							</div>

							<!-- 인생 그래프 -->
							<div class="mb-6 p-6 bg-white rounded-xl shadow-inner">
								<h4 class="text-2xl font-bold mb-4 text-center text-cyan-700">📈 인생 전체 운세 그래프</h4>
								<div class="flex justify-center">
									<canvas id="lifeFortuneChart" width="900" height="350" class="max-w-full"></canvas>
								</div>
							</div>

							<!-- 시기별 설명 -->
							<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								{#each analysis.lifeFortune.decades as decade}
									<div class="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
										<div class="flex items-center justify-between mb-2">
											<h5 class="font-bold text-lg text-cyan-700">{decade.age}</h5>
											<span class="px-3 py-1 bg-white rounded-full text-sm font-bold text-cyan-600">{decade.score}점</span>
										</div>
										<p class="text-sm text-gray-600 mb-1 font-semibold">{decade.period}</p>
										<p class="text-sm">{decade.fortune}</p>
									</div>
								{/each}
							</div>

							<!-- 중요한 시기 -->
							<div class="grid md:grid-cols-2 gap-6">
								<div class="p-5 bg-green-50 rounded-xl border-2 border-green-200">
									<h5 class="font-bold text-xl mb-3 text-green-700">🌟 최고의 시기</h5>
									<p class="text-lg">{analysis.lifeFortune.peakPeriod}</p>
								</div>
								<div class="p-5 bg-orange-50 rounded-xl border-2 border-orange-200">
									<h5 class="font-bold text-xl mb-3 text-orange-700">⚡ 도전의 시기</h5>
									<p class="text-lg">{analysis.lifeFortune.challengePeriod}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 인생 조언 -->
				{#if analysis.advice}
					<Card class="shadow-2xl border-4 border-purple-200">
						<CardHeader class="bg-gradient-to-r from-purple-100 to-indigo-100">
							<CardTitle class="text-3xl">{analysis.advice.emoji} {analysis.advice.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-6 p-8 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border-4 border-purple-300">
								<p class="text-3xl font-bold text-center text-purple-800">"{analysis.advice.quote}"</p>
							</div>

							<div class="grid md:grid-cols-2 gap-6">
								<div>
									<h5 class="font-bold text-xl mb-3 text-purple-700">📅 매일 실천할 습관</h5>
									<ul class="space-y-2">
										{#each analysis.advice.dailyHabits as habit}
											<li class="p-3 bg-purple-50 rounded-lg flex items-center gap-3">
												<span class="text-xl">✅</span>
												<span>{habit}</span>
											</li>
										{/each}
									</ul>
								</div>
								<div>
									<h5 class="font-bold text-xl mb-3 text-indigo-700">🎯 올해 목표</h5>
									<ul class="space-y-2">
										{#each analysis.advice.yearGoals as goal}
											<li class="p-3 bg-indigo-50 rounded-lg flex items-center gap-3">
												<span class="text-xl">🎪</span>
												<span>{goal}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

			<!-- 액션 버튼 -->
			<div class="flex justify-center">
				<Button variant="outline" class="text-lg px-8 py-6" on:click={() => window.location.reload()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					다시 분석하기
				</Button>
			</div>
		</div>
	{:else if form?.result?.aiAnalysis}
			<!-- 새로 분석한 결과 표시 -->
			{@const analysis = form.result.aiAnalysis}
			<div class="space-y-8 animate-slide-up">
				<!-- share 페이지와 동일한 내용이 들어갈 자리 -->
				<p class="text-center text-green-600 font-bold text-2xl">✅ 분석이 완료되었습니다!</p>

				<!-- 공유 버튼 -->
				{#if form.result.shareId}
				<div class="text-center">
					<Button on:click={copyShareUrl} size="lg" class="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
						{#if copied}
							✅ 복사 완료!
						{:else}
							🔗 친구에게 공유하기
						{/if}
					</Button>
					<p class="text-sm text-gray-500 mt-2">결과를 친구와 공유할 수 있어요</p>
				</div>
				{/if}

				<!-- TODO: share 페이지의 내용을 여기에 복사 -->
			</div>
		{/if}

		<!-- 푸터 -->
		<div class="text-center mt-12 text-gray-600">
			<p class="text-lg">🤖 Powered by Gemini 2.5 Flash AI</p>
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

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-10px); }
		75% { transform: translateX(10px); }
	}

	.animate-bounce-in {
		animation: bounce-in 0.6s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 0.6s ease-out;
	}

	.animate-slide-in {
		animation: slide-in 0.4s ease-out;
	}

	.animate-shake {
		animation: shake 0.5s ease-out;
	}
</style>
