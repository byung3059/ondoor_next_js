/* =========================================================
 * Ondoor SEO / GEO 기본 설정 (원본: theme/basic/head.sub.php의 $od)
 * ========================================================= */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ondoor.co.kr").replace(/\/$/, "");
export const THEME_URL = "/theme/basic"; // public/theme/basic (CSS · 이미지)
export const BLOG_URL = `${SITE_URL}/blog/`; // 블로그는 워드프레스(/blog/) — 이 프로젝트엔 없어서 실제 사이트로 연결

// 관리자 > 기본환경설정 > 홈페이지 제목 ($config['cf_title'])
export const CF_TITLE = "ondoor";

export const od = {
	name: "Ondoor",
	nameAlt: "온도어",
	slogan: "온도어 기업·브랜드 종합 홈페이지 제작 웹에이전시",
	desc: "Ondoor(온도어)는 기업·브랜드·쇼핑몰·랜딩페이지 등 종합 홈페이지 기획, 디자인, 퍼블리싱, 개발부터 SEO·GEO 최적화와 유지보수까지 제공하는 웹에이전시입니다.",
	keywords: "ondoor, 온도어, 웹에이전시, 홈페이지 제작, 기업 홈페이지 제작, 쇼핑몰 제작, 랜딩페이지 제작, 웹디자인, SEO, GEO",
	logo: `${SITE_URL}${THEME_URL}/img/favicon.png`,
	ogImage: `${SITE_URL}${THEME_URL}/img/og_image.jpg`,
	legalName: "Ondoor - 온도어",
	ceo: "변영성",
	bizNo: "323-07-03398",
	tel: "+82-10-2300-3059",
	telDisplay: "010-2300-3059",
	email: "byung3059@naver.com",
	street: "장한로 105",
	locality: "동대문구",
	regionName: "서울특별시",
	region: "KR-11",
	areaServed: "대한민국",
	services: ["홈페이지 제작", "기업 홈페이지 제작", "쇼핑몰 제작", "랜딩페이지 제작", "웹디자인", "SEO·GEO 최적화"],
};

// 메인: "Ondoor | 슬로건" / 서브: "페이지명 | Ondoor"
export function pageMetadata({ title, path = "/" } = {}) {
	const headTitle = title ? `${title} | ${od.name}` : `${od.name} | ${od.slogan}`;
	const url = SITE_URL + path;
	return {
		title: { absolute: headTitle },
		description: od.desc,
		keywords: od.keywords,
		authors: [{ name: od.name }],
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
		alternates: { canonical: url, languages: { "ko-KR": url } },
		openGraph: {
			type: "website",
			siteName: od.name,
			locale: "ko_KR",
			title: headTitle,
			description: od.desc,
			url,
			images: [{ url: od.ogImage, alt: headTitle }],
		},
		twitter: { card: "summary_large_image", title: headTitle, description: od.desc, images: [od.ogImage] },
		other: {
			googlebot: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
			yeti: "index, follow",
			"geo.region": od.region,
			"geo.placename": `${od.regionName} ${od.locality}`,
		},
	};
}

// 구조화 데이터 (JSON-LD) — 원본 head.sub.php의 $od_graph
export function jsonLd({ title, path = "/" } = {}) {
	const headTitle = title ? `${title} | ${od.name}` : `${od.name} | ${od.slogan}`;
	const url = SITE_URL + path;
	const orgId = `${SITE_URL}/#organization`;
	const siteId = `${SITE_URL}/#website`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": ["Organization", "ProfessionalService"],
				"@id": orgId,
				name: od.name,
				alternateName: od.nameAlt,
				legalName: od.legalName,
				taxID: od.bizNo,
				founder: { "@type": "Person", name: od.ceo, jobTitle: "대표" },
				slogan: od.slogan,
				description: od.desc,
				url: SITE_URL + "/",
				logo: { "@type": "ImageObject", url: od.logo },
				image: od.ogImage,
				telephone: od.tel,
				email: od.email,
				areaServed: od.areaServed,
				knowsAbout: od.services,
				address: {
					"@type": "PostalAddress",
					streetAddress: od.street,
					addressLocality: od.locality,
					addressRegion: od.regionName,
					addressCountry: "KR",
				},
				contactPoint: {
					"@type": "ContactPoint",
					contactType: "customer service",
					telephone: od.tel,
					email: od.email,
					availableLanguage: ["Korean"],
				},
				hasOfferCatalog: {
					"@type": "OfferCatalog",
					name: `${od.name} 서비스`,
					itemListElement: od.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })),
				},
			},
			{
				"@type": "WebSite",
				"@id": siteId,
				url: SITE_URL,
				name: od.name,
				description: od.desc,
				inLanguage: "ko-KR",
				publisher: { "@id": orgId },
			},
			{
				"@type": "WebPage",
				"@id": `${url}#webpage`,
				url,
				name: headTitle,
				description: od.desc,
				inLanguage: "ko-KR",
				isPartOf: { "@id": siteId },
				about: { "@id": orgId },
			},
		],
	};
}
