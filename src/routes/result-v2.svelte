<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { onMount } from 'svelte';

	// Props로 분석 결과 받기
	export let name: string;
	export let gender: 'male' | 'female';
	export let birthDate: string;
	export let saju: {
		yearPillar: string;
		monthPillar: string;
		dayPillar: string;
		timePillar?: string;
	};
	export let analysis: any; // Gemini의 4파트 병합 결과

	let copied = false;

	// 각 섹션 존재 여부 체크 함수
	function hasData(obj: any): boolean {
		if (!obj) return false;
		if (typeof obj !== 'object') return false;
		if (Array.isArray(obj)) return obj.length > 0;
		return Object.keys(obj).length > 0;
	}

	// 배열 존재 체크
	function hasArrayData(arr: any): boolean {
		return Array.isArray(arr) && arr.length > 0;
	}

	// 문자열 존재 체크
	function hasText(str: any): boolean {
		return typeof str === 'string' && str.trim().length > 0;
	}

	async function copyShareUrl() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('복사 실패:', err);
		}
	}

	// 대운 그래프 그리기 함수
	function drawLifeFlowChart(canvas: HTMLCanvasElement, graphData: any[]) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const padding = 60;
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
			const score = 100 - i * 20;
			const y = padding + (chartHeight / 5) * i;
			ctx.fillText(score.toString(), padding - 10, y + 4);
		}

		// 선 그래프 그리기
		const pointSpacing = chartWidth / (graphData.length - 1);

		// 그라데이션 배경
		const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
		gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
		gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

		ctx.beginPath();
		graphData.forEach((point, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = point.score / 100;
			const y = height - padding - chartHeight * scoreRatio;

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
		graphData.forEach((point, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = point.score / 100;
			const y = height - padding - chartHeight * scoreRatio;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.strokeStyle = '#8b5cf6';
		ctx.lineWidth = 3;
		ctx.stroke();

		// 점과 레이블
		ctx.font = 'bold 12px sans-serif';
		ctx.textAlign = 'center';
		graphData.forEach((point, i) => {
			const x = padding + pointSpacing * i;
			const scoreRatio = point.score / 100;
			const y = height - padding - chartHeight * scoreRatio;

			// 점
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fillStyle = '#8b5cf6';
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.stroke();

			// 점수
			ctx.fillStyle = '#1f2937';
			ctx.fillText(point.score.toString(), x, y - 15);

			// 나이대
			ctx.fillStyle = '#6b7280';
			ctx.font = '11px sans-serif';
			ctx.fillText(point.ageGroup, x, height - padding + 20);
		});
	}

	// 월별 운세 그래프 그리기
	function drawMonthlyChart(canvas: HTMLCanvasElement, monthlyData: any[]) {
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

		// Y축 레이블
		ctx.fillStyle = '#6b7280';
		ctx.font = '12px sans-serif';
		ctx.textAlign = 'right';
		for (let i = 0; i <= 4; i++) {
			const score = 100 - i * 25;
			const y = padding + (chartHeight / 4) * i;
			ctx.fillText(score.toString(), padding - 10, y + 4);
		}

		// 막대 그래프
		const barWidth = chartWidth / monthlyData.length;
		const barSpacing = 8;
		const actualBarWidth = barWidth - barSpacing;

		monthlyData.forEach((data, i) => {
			const x = padding + barWidth * i + barSpacing / 2;
			const scoreRatio = data.score / 100;
			const barHeight = chartHeight * scoreRatio;
			const y = height - padding - barHeight;

			// 그라데이션
			const gradient = ctx.createLinearGradient(x, y, x, height - padding);
			gradient.addColorStop(0, '#8b5cf6');
			gradient.addColorStop(1, '#6366f1');

			// 막대
			ctx.fillStyle = gradient;
			ctx.fillRect(x, y, actualBarWidth, barHeight);

			// 테두리
			ctx.strokeStyle = '#7c3aed';
			ctx.lineWidth = 2;
			ctx.strokeRect(x, y, actualBarWidth, barHeight);

			// 점수
			ctx.fillStyle = '#1f2937';
			ctx.font = 'bold 11px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(data.score.toString(), x + actualBarWidth / 2, y - 8);

			// 기간 레이블
			ctx.fillStyle = '#6b7280';
			ctx.font = '10px sans-serif';
			ctx.fillText(data.period, x + actualBarWidth / 2, height - padding + 15);
		});
	}

	onMount(() => {
		// 대운 그래프 그리기
		if (analysis?.lifeFlow?.graph) {
			const lifeCanvas = document.querySelector('#lifeFlowChart') as HTMLCanvasElement;
			if (lifeCanvas) {
				drawLifeFlowChart(lifeCanvas, analysis.lifeFlow.graph);
			}
		}

		// 월별 운세 그래프 그리기
		if (analysis?.yearFortune?.monthly) {
			const monthlyCanvas = document.querySelector('#monthlyChart') as HTMLCanvasElement;
			if (monthlyCanvas) {
				drawMonthlyChart(monthlyCanvas, analysis.yearFortune.monthly);
			}
		}
	});
</script>

<svelte:head>
	<title>{name}님의 사주명리 분석 - 도담(道談)</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-red-50">
	<div class="container mx-auto px-4 py-8 max-w-5xl">
		<!-- 헤더: 전통적이고 권위 있는 디자인 -->
		<div class="text-center mb-12">
			<div class="inline-block mb-6">
				<div class="relative">
					<div class="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 blur-2xl opacity-30"></div>
					<div class="relative bg-gradient-to-br from-amber-100 to-red-100 rounded-full p-6 shadow-2xl border-4 border-amber-300">
						<span class="text-7xl">🔮</span>
					</div>
				</div>
			</div>

			<h1 class="text-5xl md:text-6xl font-bold mb-4 text-amber-900 tracking-wide">
				道談 <span class="text-3xl text-gray-600">(도담)</span>
			</h1>
			<p class="text-xl text-gray-700 mb-2">30년 경력 정통 명리학자의 깊이있는 분석</p>
			<div class="inline-block px-6 py-2 bg-red-100 rounded-full border-2 border-red-300">
				<p class="text-sm text-red-800 font-semibold">📜 전통 명리학 기반 AI 분석</p>
			</div>
		</div>

		<div class="space-y-8">
			<!-- 사주팔자 명식 카드 -->
			<Card class="shadow-2xl border-t-8 border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50">
				<CardHeader class="bg-gradient-to-r from-amber-900 to-red-900 text-white">
					<CardTitle class="text-3xl flex items-center justify-center gap-3">
						<span>📖</span>
						<span>{name}님의 사주명식</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="pt-8">
					<div class="mb-6 text-center space-y-2">
						<p class="text-lg text-gray-700">
							<span class="font-semibold">성별:</span> {gender === 'male' ? '남명(男命)' : '여명(女命)'}
						</p>
						<p class="text-lg text-gray-700">
							<span class="font-semibold">생년월일:</span> {birthDate}
						</p>
					</div>

					<!-- 사주팔자 (전통적인 표 형식) -->
					<div class="grid grid-cols-4 gap-3 mb-6">
						{#each [
							{ label: '年柱(년주)', value: saju.yearPillar, desc: '조상, 초년운', color: 'from-red-600 to-orange-600' },
							{ label: '月柱(월주)', value: saju.monthPillar, desc: '부모, 청년운', color: 'from-green-600 to-emerald-600' },
							{ label: '日柱(일주)', value: saju.dayPillar, desc: '본인, 중년운', color: 'from-blue-600 to-indigo-600' },
							{ label: '時柱(시주)', value: saju.timePillar || '未詳', desc: '자손, 말년운', color: 'from-purple-600 to-pink-600' }
						] as pillar}
							<div class="relative group">
								<div class="absolute inset-0 bg-gradient-to-br {pillar.color} opacity-10 rounded-xl transform group-hover:scale-105 transition-transform"></div>
								<div class="relative bg-white/90 backdrop-blur rounded-xl p-5 border-2 border-amber-300 shadow-lg hover:shadow-2xl transition-all">
									<div class="text-xs text-gray-600 mb-2 font-medium">{pillar.label}</div>
									<div class="text-4xl font-bold text-center mb-2 bg-gradient-to-br {pillar.color} bg-clip-text text-transparent">
										{pillar.value}
									</div>
									<div class="text-xs text-gray-500 text-center">{pillar.desc}</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- 명리학 해설 -->
					<div class="bg-amber-100/50 border-l-4 border-amber-600 p-4 rounded">
						<p class="text-sm text-gray-700 leading-relaxed">
							<span class="font-bold text-amber-900">명리학 기초:</span>
							사주팔자는 태어난 연월일시의 천간지지(天干地支) 여덟 글자로 구성됩니다.
							이는 음양오행의 조화를 통해 타고난 기질과 인생의 흐름을 파악하는 동양 철학의 정수입니다.
						</p>
					</div>
				</CardContent>
			</Card>

			<!-- PART 1: 기본 성향 분석 -->
			{#if hasData(analysis?.basicAnalysis)}
				<Card class="shadow-2xl border-t-8 border-indigo-600">
					<CardHeader class="bg-gradient-to-r from-indigo-100 to-purple-100">
						<CardTitle class="text-3xl text-indigo-900">
							{analysis.basicAnalysis.emoji || '🌟'} {analysis.basicAnalysis.title || '나를 정의하다'}
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 총평 -->
						{#if hasText(analysis.basicAnalysis.totalReview)}
							<div class="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
								<h4 class="text-lg font-bold mb-3 text-indigo-900 flex items-center gap-2">
									<span>📋</span>
									<span>명리학자의 총평</span>
								</h4>
								<p class="text-base leading-relaxed text-gray-800 whitespace-pre-line">{analysis.basicAnalysis.totalReview}</p>
							</div>
						{/if}

						<!-- 성격 분석 -->
						{#if hasData(analysis.basicAnalysis.personality)}
							<div class="grid md:grid-cols-2 gap-6 mb-6">
								<!-- 겉모습 -->
								{#if hasText(analysis.basicAnalysis.personality.outer)}
									<div class="p-5 bg-blue-50 rounded-xl border-2 border-blue-300">
										<h5 class="font-bold text-xl mb-3 text-blue-800 flex items-center gap-2">
											<span>👁️</span>
											<span>외면(外面) - 겉모습</span>
										</h5>
										<p class="text-gray-700 leading-relaxed">{analysis.basicAnalysis.personality.outer}</p>
									</div>
								{/if}

								<!-- 내면 -->
								{#if hasText(analysis.basicAnalysis.personality.inner)}
									<div class="p-5 bg-rose-50 rounded-xl border-2 border-rose-300">
										<h5 class="font-bold text-xl mb-3 text-rose-800 flex items-center gap-2">
											<span>❤️</span>
											<span>내면(內面) - 진짜 마음</span>
										</h5>
										<p class="text-gray-700 leading-relaxed">{analysis.basicAnalysis.personality.inner}</p>
									</div>
								{/if}
							</div>

							<!-- 강점과 약점 -->
							<div class="grid md:grid-cols-2 gap-6 mb-6">
								<!-- 강점 -->
								{#if hasArrayData(analysis.basicAnalysis.personality.strengths)}
									<div>
										<h5 class="font-bold text-xl mb-3 text-green-700 flex items-center gap-2">
											<span>✨</span>
											<span>강점(長點)</span>
										</h5>
										<ul class="space-y-2">
											{#each analysis.basicAnalysis.personality.strengths as strength}
												<li class="p-3 bg-green-50 rounded-lg border-l-4 border-green-500 text-gray-800">
													{strength}
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								<!-- 약점 -->
								{#if hasArrayData(analysis.basicAnalysis.personality.weaknesses)}
									<div>
										<h5 class="font-bold text-xl mb-3 text-orange-700 flex items-center gap-2">
											<span>⚡</span>
											<span>보완점(補完點)</span>
										</h5>
										<ul class="space-y-2">
											{#each analysis.basicAnalysis.personality.weaknesses as weakness}
												<li class="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500 text-gray-800">
													{weakness}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{/if}

						<!-- 적성 분석 -->
						{#if hasText(analysis.basicAnalysis.aptitude)}
							<div class="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300">
								<h5 class="font-bold text-xl mb-3 text-purple-800 flex items-center gap-2">
									<span>🎯</span>
									<span>적성과 잠재력</span>
								</h5>
								<p class="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.basicAnalysis.aptitude}</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- PART 2: 부와 명예 -->
			{#if hasData(analysis?.wealthAndCareer)}
				<Card class="shadow-2xl border-t-8 border-emerald-600">
					<CardHeader class="bg-gradient-to-r from-emerald-100 to-teal-100">
						<CardTitle class="text-3xl text-emerald-900">
							{analysis.wealthAndCareer.emoji || '💼'} {analysis.wealthAndCareer.title || '부와 명예의 흐름'}
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 직업 스타일 -->
						{#if hasText(analysis.wealthAndCareer.jobStyle)}
							<div class="mb-6 p-5 bg-emerald-50 rounded-xl border-2 border-emerald-300">
								<h5 class="font-bold text-xl mb-3 text-emerald-800 flex items-center gap-2">
									<span>🏢</span>
									<span>직업 운용 스타일</span>
								</h5>
								<p class="text-gray-700 leading-relaxed">{analysis.wealthAndCareer.jobStyle}</p>
							</div>
						{/if}

						<!-- 적합한 직업 -->
						{#if hasArrayData(analysis.wealthAndCareer.suitableJobs)}
							<div class="mb-6">
								<h5 class="font-bold text-xl mb-4 text-emerald-800 flex items-center gap-2">
									<span>💼</span>
									<span>적합한 직업군</span>
								</h5>
								<div class="grid md:grid-cols-2 gap-3">
									{#each analysis.wealthAndCareer.suitableJobs as job}
										<div class="p-4 bg-white rounded-lg border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
											<span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-2">
												추천
											</span>
											<p class="text-gray-800 font-medium">{job}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- 재물운 -->
						{#if hasText(analysis.wealthAndCareer.wealthLuck)}
							<div class="mb-6 p-5 bg-yellow-50 rounded-xl border-2 border-yellow-400">
								<h5 class="font-bold text-xl mb-3 text-yellow-800 flex items-center gap-2">
									<span>💰</span>
									<span>재물운(財物運)</span>
								</h5>
								<p class="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.wealthAndCareer.wealthLuck}</p>
							</div>
						{/if}

						<!-- 성공 전략 -->
						{#if hasText(analysis.wealthAndCareer.successStrategy)}
							<div class="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-400">
								<h5 class="font-bold text-xl mb-3 text-amber-900 flex items-center gap-2">
									<span>🎯</span>
									<span>성공 전략</span>
								</h5>
								<p class="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.wealthAndCareer.successStrategy}</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- PART 3: 관계와 건강 -->
			{#if hasData(analysis?.relationships) || hasData(analysis?.health)}
				<Card class="shadow-2xl border-t-8 border-pink-600">
					<CardHeader class="bg-gradient-to-r from-pink-100 to-rose-100">
						<CardTitle class="text-3xl text-pink-900">
							{analysis.relationships?.emoji || '💕'} 인연과 건강
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 관계 섹션 -->
						{#if hasData(analysis.relationships)}
							<div class="mb-8">
								<h4 class="text-2xl font-bold mb-4 text-pink-800 border-b-2 border-pink-300 pb-2">
									{analysis.relationships.title || '인연과 사랑'}
								</h4>

								<!-- 연애 스타일 (상세) -->
								{#if hasData(analysis.relationships.loveStyle)}
									<div class="mb-6 p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-300">
										<h5 class="font-bold text-xl mb-4 text-pink-800 flex items-center gap-2">
											<span>💕</span>
											<span>연애 스타일</span>
										</h5>
										<div class="space-y-3">
											{#if hasText(analysis.relationships.loveStyle.approach)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-pink-400">
													<p class="text-sm font-semibold text-pink-700 mb-1">연애 접근 방식</p>
													<p class="text-gray-700">{analysis.relationships.loveStyle.approach}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveStyle.expression)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-pink-400">
													<p class="text-sm font-semibold text-pink-700 mb-1">애정 표현 스타일</p>
													<p class="text-gray-700">{analysis.relationships.loveStyle.expression}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveStyle.compatibility)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-pink-400">
													<p class="text-sm font-semibold text-pink-700 mb-1">잘 맞는 이성 유형</p>
													<p class="text-gray-700">{analysis.relationships.loveStyle.compatibility}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveStyle.dating)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-pink-400">
													<p class="text-sm font-semibold text-pink-700 mb-1">연애 특징</p>
													<p class="text-gray-700">{analysis.relationships.loveStyle.dating}</p>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- 연애운 (신규) -->
								{#if hasData(analysis.relationships.loveFortune)}
									<div class="mb-6 p-5 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-300">
										<h5 class="font-bold text-xl mb-4 text-red-800 flex items-center gap-2">
											<span>❤️</span>
											<span>연애운</span>
										</h5>
										<div class="space-y-3">
											{#if hasText(analysis.relationships.loveFortune.overall)}
												<div class="p-4 bg-white rounded-lg border-2 border-red-200">
													<p class="text-gray-800 leading-relaxed">{analysis.relationships.loveFortune.overall}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveFortune.timing)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-red-400">
													<p class="text-sm font-semibold text-red-700 mb-1">🌟 좋은 시기</p>
													<p class="text-gray-700">{analysis.relationships.loveFortune.timing}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveFortune.challenges)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-red-400">
													<p class="text-sm font-semibold text-red-700 mb-1">⚡ 어려움</p>
													<p class="text-gray-700">{analysis.relationships.loveFortune.challenges}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.loveFortune.advice)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-red-400">
													<p class="text-sm font-semibold text-red-700 mb-1">💡 조언</p>
													<p class="text-gray-700">{analysis.relationships.loveFortune.advice}</p>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- 애정운 (신규) -->
								{#if hasData(analysis.relationships.affectionLuck)}
									<div class="mb-6 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300">
										<h5 class="font-bold text-xl mb-4 text-purple-800 flex items-center gap-2">
											<span>💖</span>
											<span>애정운</span>
										</h5>
										<div class="space-y-3">
											{#if hasText(analysis.relationships.affectionLuck.charm)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-purple-400">
													<p class="text-sm font-semibold text-purple-700 mb-1">✨ 매력 포인트</p>
													<p class="text-gray-700">{analysis.relationships.affectionLuck.charm}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.affectionLuck.popularity)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-purple-400">
													<p class="text-sm font-semibold text-purple-700 mb-1">🌟 이성 인기도</p>
													<p class="text-gray-700">{analysis.relationships.affectionLuck.popularity}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.affectionLuck.romanticTendency)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-purple-400">
													<p class="text-sm font-semibold text-purple-700 mb-1">🌹 낭만 성향</p>
													<p class="text-gray-700">{analysis.relationships.affectionLuck.romanticTendency}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.affectionLuck.longTermLove)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-purple-400">
													<p class="text-sm font-semibold text-purple-700 mb-1">💑 장기 연애력</p>
													<p class="text-gray-700">{analysis.relationships.affectionLuck.longTermLove}</p>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- 배우자운 (상세) -->
								{#if hasData(analysis.relationships.spouseLuck)}
									<div class="mb-6 p-5 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border-2 border-rose-300">
										<h5 class="font-bold text-xl mb-4 text-rose-800 flex items-center gap-2">
											<span>💑</span>
											<span>배우자운</span>
										</h5>
										<div class="space-y-3">
											{#if hasText(analysis.relationships.spouseLuck.timing)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-rose-400">
													<p class="text-sm font-semibold text-rose-700 mb-1">⏰ 결혼 적령기</p>
													<p class="text-gray-700">{analysis.relationships.spouseLuck.timing}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.spouseLuck.idealSpouse)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-rose-400">
													<p class="text-sm font-semibold text-rose-700 mb-1">👤 이상적인 배우자</p>
													<p class="text-gray-700">{analysis.relationships.spouseLuck.idealSpouse}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.spouseLuck.marriageStyle)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-rose-400">
													<p class="text-sm font-semibold text-rose-700 mb-1">🏠 결혼 생활</p>
													<p class="text-gray-700">{analysis.relationships.spouseLuck.marriageStyle}</p>
												</div>
											{/if}
											{#if hasText(analysis.relationships.spouseLuck.advice)}
												<div class="p-3 bg-white rounded-lg border-l-4 border-rose-400">
													<p class="text-sm font-semibold text-rose-700 mb-1">💡 조언</p>
													<p class="text-gray-700">{analysis.relationships.spouseLuck.advice}</p>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- 대인운 -->
								{#if hasText(analysis.relationships.socialLuck)}
									<div class="mb-4 p-5 bg-indigo-50 rounded-xl border-2 border-indigo-300">
										<h5 class="font-bold text-lg mb-2 text-indigo-800">🤝 대인운 및 귀인</h5>
										<p class="text-gray-700 leading-relaxed">{analysis.relationships.socialLuck}</p>
									</div>
								{/if}

								<!-- 주의사항 -->
								{#if hasText(analysis.relationships.caution)}
									<div class="p-5 bg-orange-50 rounded-xl border-2 border-orange-400">
										<h5 class="font-bold text-lg mb-2 text-orange-800 flex items-center gap-2">
											<span>⚠️</span>
											<span>인간관계 주의점</span>
										</h5>
										<p class="text-gray-700 leading-relaxed">{analysis.relationships.caution}</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- 건강 섹션 -->
						{#if hasData(analysis.health)}
							<div>
								<h4 class="text-2xl font-bold mb-4 text-green-800 border-b-2 border-green-300 pb-2 flex items-center gap-2">
									<span>{analysis.health.emoji || '🌿'}</span>
									<span>{analysis.health.title || '건강과 컨디션'}</span>
								</h4>

								<!-- 체질 -->
								{#if hasText(analysis.health.constitution)}
									<div class="mb-4 p-5 bg-green-50 rounded-xl border-2 border-green-300">
										<h5 class="font-bold text-lg mb-2 text-green-800">🌿 타고난 체질</h5>
										<p class="text-gray-700 leading-relaxed">{analysis.health.constitution}</p>
									</div>
								{/if}

								<!-- 주의 장기 -->
								{#if hasArrayData(analysis.health.cautionOrgans)}
									<div class="mb-4 p-5 bg-yellow-50 rounded-xl border-2 border-yellow-400">
										<h5 class="font-bold text-lg mb-2 text-yellow-800">⚡ 주의해야 할 장기</h5>
										<div class="flex flex-wrap gap-2">
											{#each analysis.health.cautionOrgans as organ}
												<span class="px-3 py-1 bg-white border-2 border-yellow-400 rounded-full text-sm font-semibold">
													{organ}
												</span>
											{/each}
										</div>
									</div>
								{/if}

								<!-- 건강 조언 -->
								{#if hasText(analysis.health.healthAdvice)}
									<div class="p-5 bg-blue-50 rounded-xl border-2 border-blue-300">
										<h5 class="font-bold text-lg mb-2 text-blue-800">💊 건강 관리 조언</h5>
										<p class="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.health.healthAdvice}</p>
									</div>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- PART 4-1: 인생 대운 -->
			{#if hasData(analysis?.lifeFlow)}
				<Card class="shadow-2xl border-t-8 border-cyan-600">
					<CardHeader class="bg-gradient-to-r from-cyan-100 to-blue-100">
						<CardTitle class="text-3xl text-cyan-900">
							{analysis.lifeFlow.emoji || '🌊'} {analysis.lifeFlow.title || '인생 전체 대운'}
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 인생 흐름 요약 -->
						{#if hasText(analysis.lifeFlow.summary)}
							<div class="mb-6 p-5 bg-cyan-50 rounded-xl border-2 border-cyan-300">
								<p class="text-gray-800 leading-relaxed whitespace-pre-line">{analysis.lifeFlow.summary}</p>
							</div>
						{/if}

						<!-- 황금기 -->
						{#if hasText(analysis.lifeFlow.primeEra)}
							<div class="mb-6 p-5 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl border-2 border-yellow-400">
								<h5 class="font-bold text-xl mb-2 text-yellow-900 flex items-center gap-2">
									<span>🌟</span>
									<span>황금기(黃金期)</span>
								</h5>
								<p class="text-gray-800 leading-relaxed">{analysis.lifeFlow.primeEra}</p>
							</div>
						{/if}

						<!-- 대운 그래프 -->
						{#if hasArrayData(analysis.lifeFlow.graph)}
							<div class="mb-6 p-6 bg-white rounded-xl shadow-inner border-2 border-cyan-200">
								<h5 class="text-xl font-bold mb-4 text-center text-cyan-800">📈 인생 대운 그래프</h5>
								<div class="flex justify-center">
									<canvas id="lifeFlowChart" width="900" height="350" class="max-w-full"></canvas>
								</div>
							</div>

							<!-- 시기별 상세 설명 -->
							<div class="grid md:grid-cols-2 gap-4">
								{#each analysis.lifeFlow.graph as item}
									<div class="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
										<div class="flex items-center justify-between mb-2">
											<h6 class="font-bold text-lg text-cyan-800">{item.ageGroup}</h6>
											<span class="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm font-bold">
												{item.score}점
											</span>
										</div>
										<p class="text-sm font-semibold text-blue-700 mb-1">키워드: {item.keyword}</p>
										<p class="text-sm text-gray-700">{item.desc}</p>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- PART 4-2: 신년 운세 -->
			{#if hasData(analysis?.yearFortune)}
				<Card class="shadow-2xl border-t-8 border-purple-600">
					<CardHeader class="bg-gradient-to-r from-purple-100 to-indigo-100">
						<CardTitle class="text-3xl text-purple-900">
							{analysis.yearFortune.emoji || '🎊'} {analysis.yearFortune.title || '신년 운세'}
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 신년 총평 -->
						{#if hasText(analysis.yearFortune.overview)}
							<div class="mb-6 p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border-2 border-purple-400">
								<h5 class="font-bold text-xl mb-3 text-purple-900">📋 신년 총평</h5>
								<p class="text-gray-800 leading-relaxed whitespace-pre-line">{analysis.yearFortune.overview}</p>
							</div>
						{/if}

						<!-- 분기별 운세 그래프 -->
						{#if hasArrayData(analysis.yearFortune.monthly)}
							<div class="mb-6 p-6 bg-white rounded-xl shadow-inner border-2 border-purple-200">
								<h5 class="text-xl font-bold mb-4 text-center text-purple-800">📊 분기별 운세 그래프</h5>
								<div class="flex justify-center">
									<canvas id="monthlyChart" width="800" height="300" class="max-w-full"></canvas>
								</div>
							</div>

							<!-- 분기별 상세 운세 -->
							<div class="grid md:grid-cols-2 gap-4">
								{#each analysis.yearFortune.monthly as quarter}
									<div class="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300">
										<div class="flex items-center justify-between mb-3">
											<h6 class="font-bold text-xl text-purple-800">{quarter.period}</h6>
											<span class="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
												{quarter.score}점
											</span>
										</div>
										<div class="mb-3 p-3 bg-white rounded-lg">
											<p class="text-gray-700 leading-relaxed">{quarter.fortune}</p>
										</div>
										<div class="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
											<p class="text-sm font-semibold text-amber-900">💡 행동 지침</p>
											<p class="text-sm text-gray-700">{quarter.action}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- PART 4-3: 도담의 처방 -->
			{#if hasData(analysis?.finalAdvice)}
				<Card class="shadow-2xl border-t-8 border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50">
					<CardHeader class="bg-gradient-to-r from-amber-900 to-red-900 text-white">
						<CardTitle class="text-3xl flex items-center justify-center gap-2">
							<span>{analysis.finalAdvice.emoji || '📜'}</span>
							<span>{analysis.finalAdvice.title || '도담의 처방'}</span>
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-6">
						<!-- 행운의 아이템 -->
						{#if hasData(analysis.finalAdvice.luckyItems)}
							<div class="mb-6 p-6 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl border-2 border-yellow-400">
								<h5 class="font-bold text-xl mb-4 text-amber-900 flex items-center gap-2">
									<span>🍀</span>
									<span>행운의 기운을 높이는 방법</span>
								</h5>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
									{#if hasText(analysis.finalAdvice.luckyItems.color)}
										<div class="text-center p-3 bg-white rounded-lg border-2 border-yellow-300">
											<div class="text-2xl mb-1">🎨</div>
											<div class="text-xs text-gray-600 mb-1">색상</div>
											<div class="font-bold text-gray-800">{analysis.finalAdvice.luckyItems.color}</div>
										</div>
									{/if}
									{#if hasText(analysis.finalAdvice.luckyItems.number)}
										<div class="text-center p-3 bg-white rounded-lg border-2 border-yellow-300">
											<div class="text-2xl mb-1">🔢</div>
											<div class="text-xs text-gray-600 mb-1">숫자</div>
											<div class="font-bold text-gray-800">{analysis.finalAdvice.luckyItems.number}</div>
										</div>
									{/if}
									{#if hasText(analysis.finalAdvice.luckyItems.direction)}
										<div class="text-center p-3 bg-white rounded-lg border-2 border-yellow-300">
											<div class="text-2xl mb-1">🧭</div>
											<div class="text-xs text-gray-600 mb-1">방향</div>
											<div class="font-bold text-gray-800">{analysis.finalAdvice.luckyItems.direction}</div>
										</div>
									{/if}
									{#if hasText(analysis.finalAdvice.luckyItems.item)}
										<div class="text-center p-3 bg-white rounded-lg border-2 border-yellow-300">
											<div class="text-2xl mb-1">💎</div>
											<div class="text-xs text-gray-600 mb-1">물건</div>
											<div class="font-bold text-gray-800">{analysis.finalAdvice.luckyItems.item}</div>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- 명언 -->
						{#if hasText(analysis.finalAdvice.wiseSaying)}
							<div class="mb-6 p-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border-4 border-indigo-400 relative overflow-hidden">
								<div class="absolute top-2 left-4 text-6xl text-indigo-300 opacity-30">"</div>
								<div class="absolute bottom-2 right-4 text-6xl text-indigo-300 opacity-30">"</div>
								<p class="text-2xl md:text-3xl font-bold text-center text-indigo-900 relative z-10 leading-relaxed">
									{analysis.finalAdvice.wiseSaying}
								</p>
							</div>
						{/if}

						<!-- 마무리 인사 -->
						{#if hasText(analysis.finalAdvice.closing)}
							<div class="p-6 bg-white rounded-xl border-2 border-amber-300">
								<p class="text-gray-800 leading-relaxed whitespace-pre-line text-center italic">
									{analysis.finalAdvice.closing}
								</p>
								<p class="text-right mt-4 text-amber-900 font-bold">- 도담(道談) 올림</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- 푸터 -->
		<div class="text-center mt-12 py-6 border-t-2 border-amber-300">
			<p class="text-gray-600 mb-2">🔮 도담(道談) - 전통 명리학 AI 분석 시스템</p>
			<p class="text-sm text-gray-500">본 분석은 전통 명리학 이론을 기반으로 한 참고 자료입니다.</p>
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in) {
		animation: fadeIn 0.6s ease-out;
	}
</style>
