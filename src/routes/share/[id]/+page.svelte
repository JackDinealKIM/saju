<script lang="ts">
	import ResultV2 from '../../result-v2.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// AI 분석 결과 파싱 (문자열인 경우 JSON으로 변환)
	let analysis = data.result.aiAnalysis;
	if (typeof analysis === 'string') {
		try {
			analysis = JSON.parse(analysis);
			console.log('✅ [Share] JSON 파싱 성공');
		} catch (e) {
			console.error('❌ [Share] JSON 파싱 실패:', e);
		}
	}

	console.log('📊 [Share] 최종 분석 데이터:', analysis);
</script>

<svelte:head>
	<title>{data.result.name}님의 사주명리 분석 - 도담(道談)</title>
</svelte:head>

<ResultV2
	name={data.result.name}
	gender={data.result.gender}
	birthDate={data.result.birthDate}
	saju={data.result.saju}
	analysis={analysis}
/>
