<script lang="ts">
	import { page } from '$app/stores';

	// URL에서 shareId 가져오기
	const shareId = $page.url.searchParams.get('shareId');
</script>

<svelte:head>
	<title>데이터 디버깅</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold mb-6">AI 분석 데이터 디버깅</h1>

		{#if shareId}
			<div class="bg-white rounded-lg shadow p-6 mb-4">
				<h2 class="text-xl font-bold mb-2">Share ID</h2>
				<p class="font-mono text-sm">{shareId}</p>
				<a href="/share/{shareId}" class="text-blue-600 hover:underline mt-2 inline-block">
					→ 실제 결과 페이지 보기
				</a>
			</div>
		{:else}
			<div class="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
				<p class="text-yellow-800">URL에 ?shareId=xxx 파라미터를 추가해주세요.</p>
			</div>
		{/if}

		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-xl font-bold mb-4">사용법</h2>
			<ol class="list-decimal list-inside space-y-2">
				<li>사주 분석을 완료하세요</li>
				<li>결과 페이지에서 공유 링크를 복사하세요</li>
				<li>공유 링크의 마지막 부분(shareId)을 확인하세요</li>
				<li>이 페이지 URL에 <code class="bg-gray-100 px-2 py-1 rounded">?shareId=복사한ID</code>를 추가하세요</li>
			</ol>
		</div>

		<div class="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-6">
			<h2 class="text-xl font-bold mb-4">또는 브라우저 콘솔 확인</h2>
			<ol class="list-decimal list-inside space-y-2 text-sm">
				<li>F12 (또는 Cmd+Option+I) 눌러서 개발자 도구 열기</li>
				<li>Console 탭으로 이동</li>
				<li>share 페이지에서 다음 명령 실행:
					<pre class="bg-gray-800 text-green-400 p-3 rounded mt-2 overflow-x-auto"><code>console.log(JSON.stringify(window.__PAGE_DATA__, null, 2))</code></pre>
				</li>
			</ol>
		</div>
	</div>
</div>

<style>
	code {
		font-family: 'Courier New', monospace;
	}
</style>
