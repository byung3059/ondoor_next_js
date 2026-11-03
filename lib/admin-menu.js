// 관리자 좌측 메뉴 · 대시보드 바로가기 (원본: extend/adm_theme/config.php의 menu · shortcuts)
import { BLOG_URL } from "./site";

// 좌측 아이콘 메뉴 그룹 — [이름, 주소, 새 창 여부]
export const MENU = [
	{
		key: "contact",
		icon: "forum",
		title: "상담 관리",
		items: [
			["상담 문의", "/admin/contacts"],
			["새 문의", "/admin/contacts?status=new"],
			["연락 중", "/admin/contacts?status=contacted"],
			["완료", "/admin/contacts?status=done"],
		],
	},
	{
		key: "site",
		icon: "public",
		title: "사이트",
		items: [
			["홈페이지", "/", true],
			["회사소개", "/page/ondoor", true],
			["상담문의 페이지", "/page/contact", true],
			["블로그", BLOG_URL, true],
			["블로그 관리", `${BLOG_URL}wp-admin/`, true],
		],
	},
	{
		key: "tools",
		icon: "build",
		title: "외부 도구",
		items: [
			["Vercel", "https://vercel.com/dashboard", true],
			["Neon DB", "https://console.neon.tech/", true],
			["Google Search Console", "https://search.google.com/search-console", true],
			["네이버 서치어드바이저", "https://searchadvisor.naver.com/console/board", true],
			["Google Analytics", "https://analytics.google.com/", true],
			["GitHub 저장소", "https://github.com/byung3059/ondoor_next_js", true],
		],
	},
];

// 대시보드 '바로가기' (최대 9개) — [이름, 주소, 아이콘, 새 창 여부]
export const SHORTCUTS = [
	["상담 문의", "/admin/contacts", "forum"],
	["새 문의", "/admin/contacts?status=new", "mark_chat_unread"],
	["CSV 내려받기", "/admin/export", "download"],
	["홈페이지", "/", "public", true],
	["블로그 관리", `${BLOG_URL}wp-admin/`, "edit_note", true],
	["Vercel", "https://vercel.com/dashboard", "cloud", true],
	["Neon DB", "https://console.neon.tech/", "database", true],
	["서치콘솔", "https://search.google.com/search-console", "travel_explore", true],
	["애널리틱스", "https://analytics.google.com/", "monitoring", true],
];
