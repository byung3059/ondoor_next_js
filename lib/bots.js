// 봇 · 기기 구분 (원본: 그누보드 lib/tracking_bot.lib.php와 같은 목록 · 순서 — 더 구체적인 이름이 먼저)
// [User-Agent에 들어 있는 글자(소문자), 이름, 운영사, 구분]
export const BOTS = [
	["gptbot", "GPTBot", "OpenAI", "AI"],
	["oai-searchbot", "OAI-SearchBot", "OpenAI", "AI"],
	["chatgpt-user", "ChatGPT-User", "OpenAI", "AI"],
	["claudebot", "ClaudeBot", "Anthropic", "AI"],
	["claude-searchbot", "Claude-SearchBot", "Anthropic", "AI"],
	["claude-user", "Claude-User", "Anthropic", "AI"],
	["anthropic-ai", "anthropic-ai", "Anthropic", "AI"],
	["perplexitybot", "PerplexityBot", "Perplexity", "AI"],
	["perplexity-user", "Perplexity-User", "Perplexity", "AI"],
	["ccbot", "CCBot", "CommonCrawl", "AI"],
	["bytespider", "Bytespider", "ByteDance", "AI"],
	["amazonbot", "Amazonbot", "Amazon", "AI"],
	["meta-externalagent", "meta-externalagent", "Meta", "AI"],
	["meta-externalfetcher", "meta-externalfetcher", "Meta", "AI"],
	["diffbot", "Diffbot", "Diffbot", "AI"],
	["cohere-ai", "cohere-ai", "Cohere", "AI"],
	["duckassistbot", "DuckAssistBot", "DuckDuckGo", "AI"],
	["google-extended", "Google-Extended", "Google", "AI"],
	["google-gemininotebook", "Gemini Notebook", "Google", "AI"],
	["google-notebooklm", "NotebookLM (Legacy)", "Google", "AI"],
	["google-agent", "Google-Agent", "Google", "AI"],
	["youbot", "YouBot", "You.com", "AI"],
	["applebot-extended", "Applebot-Extended", "Apple", "AI"],
	["google-inspectiontool", "Google-InspectionTool", "Google", "검색"],
	["storebot-google", "Storebot-Google", "Google", "검색"],
	["googlebot-image", "Googlebot-Image", "Google", "검색"],
	["googlebot", "Googlebot", "Google", "검색"],
	["adsbot-google", "AdsBot-Google", "Google", "검색"],
	["applebot", "Applebot", "Apple", "검색"],
	["bingbot", "bingbot", "Microsoft", "검색"],
	["bingpreview", "BingPreview", "Microsoft", "검색"],
	["yeti", "Yeti", "Naver", "검색"],
	["daumoa", "Daumoa", "Kakao/Daum", "검색"],
	["yandexbot", "YandexBot", "Yandex", "검색"],
	["baiduspider", "Baiduspider", "Baidu", "검색"],
	["duckduckbot", "DuckDuckBot", "DuckDuckGo", "검색"],
	["petalbot", "PetalBot", "Huawei", "검색"],
	["semrushbot", "SemrushBot", "Semrush", "SEO"],
	["ahrefsbot", "AhrefsBot", "Ahrefs", "SEO"],
	["mj12bot", "MJ12bot", "Majestic", "SEO"],
	["dotbot", "DotBot", "Moz", "SEO"],
];

// 봇이면 { name, owner, kind }, 아니면 null
export function botOf(ua) {
	const s = String(ua || "").toLowerCase();
	for (const [key, name, owner, kind] of BOTS) if (s.includes(key)) return { name, owner, kind };
	return null;
}

// pc | mobile | tablet
export function deviceOf(ua) {
	const s = String(ua || "").toLowerCase();
	if (/ipad|tablet|(android(?!.*mobile))/.test(s)) return "tablet";
	if (/mobile|iphone|android/.test(s)) return "mobile";
	return "pc";
}
