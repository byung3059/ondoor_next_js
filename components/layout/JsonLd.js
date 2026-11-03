import { jsonLd } from "@/lib/site";

// 구조화 데이터 (JSON-LD) — 페이지마다 WebPage 항목이 다름 (원본: head.sub.php)
export default function JsonLd({ title, path }) {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd({ title, path })).replace(/</g, "\\u003c") }} />;
}
