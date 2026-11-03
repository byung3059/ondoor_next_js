"use client";

import { useRef } from "react";
import DemoBox from "./DemoBox";
import { gsap, useGSAP } from "@/lib/fx/gsap";

// 코드 한 줄 HTML 조각: 태그 · 속성 · 문자열 색
const T = (s) => `<span class="t">${s}</span>`,
	A = (s) => `<span class="a">${s}</span>`,
	S = (s) => `<span class="s">${s}</span>`;

// [코드 한 줄, 그 줄이 들어갔을 때 미리보기에 생기는 변화(effect 안에서 연결)]
const LINES = [
	[`${T("&lt;title&gt;")}브랜드 | 홈페이지 제작${T("&lt;/title&gt;")}`, "title"],
	[`${T("&lt;meta")} ${A("name")}=${S('"description"')} ${A("content")}=${S('"기업 · 병원 홈페이지 제작"')}${T("&gt;")}`, "desc"],
	[`${T("&lt;meta")} ${A("property")}=${S('"og:image"')} ${A("content")}=${S('"/og.jpg"')}${T("&gt;")}`, "thumb"],
	[`${T('&lt;script type="application/ld+json"&gt;')}`, null],
	[`  { ${S('"@type"')}: ${S('"Organization"')}, ${S('"aggregateRating"')}: 4.9 }`, "rate"],
	[`${T("&lt;/script&gt;")}`, null],
	[`${T("&lt;meta")} ${A("name")}=${S('"google-site-verification"')} ${A("content")}=${S('"…"')}${T("&gt;")}`, "gsc"],
	[`${T("&lt;meta")} ${A("name")}=${S('"naver-site-verification"')} ${A("content")}=${S('"…"')}${T("&gt;")}`, "nsa"],
	[`${T("&lt;script")} ${A("src")}=${S('"googletagmanager.com/gtag/js?id=G-…"')}${T("&gt;&lt;/script&gt;")}`, "ga"],
];

/* 데모 seo: 코드가 한 줄씩 입력될 때마다 검색 결과 미리보기가 채워짐 (제목 → 설명 → 썸네일 → 별점)
   + 서치콘솔 · 서치어드바이저 · 애널리틱스가 차례로 연결됨 (애널리틱스는 방문자 수가 올라감) */
export default function DemoSEO({ control }) {
	const ref = useRef(null);

	useGSAP(
		() => {
			const box = ref.current;
			const prev = box.querySelector(".seo_prev");
			const title = box.querySelector(".seo_title"),
				desc = box.querySelector(".seo_desc");
			const lines = [...box.querySelectorAll(".seo_code .ln")];
			const gaNum = box.querySelector('[data-tool="ga"] b');
			const gaCount = { n: 0 };
			const tool = (k) => box.querySelector(`[data-tool="${k}"]`).classList.add("is-on");
			const FX = {
				title: () => ((title.textContent = "브랜드 | 홈페이지 · 쇼핑몰 제작"), prev.classList.add("has-title")),
				desc: () => ((desc.textContent = "기업 · 병원 홈페이지와 쇼핑몰을 기획부터 SEO까지 제작합니다."), prev.classList.add("has-desc")),
				thumb: () => prev.classList.add("has-thumb"),
				rate: () => prev.classList.add("has-rate"),
				gsc: () => tool("gsc"),
				nsa: () => tool("nsa"),
				ga: () => {
					tool("ga");
					gsap.fromTo(gaCount, { n: 0 }, { n: 128, duration: 2.4, ease: "power2.out", onUpdate: () => (gaNum.textContent = Math.round(gaCount.n)) });
				},
			};
			const reset = () => {
				title.textContent = "example.com";
				desc.textContent = "이 페이지에 대한 정보가 없습니다.";
				prev.className = "seo_prev";
				box.querySelectorAll(".seo_tools li").forEach((li) => li.classList.remove("is-on"));
				gsap.killTweensOf(gaCount);
				gaNum.textContent = "0";
				lines.forEach((ln) => ln.classList.remove("is-on"));
				gsap.set(lines, { clipPath: "inset(0 100% 0 0)" });
			};

			// 다 채워진 모습(가장 큰 높이)을 먼저 재서 상자 높이로 잡아 둠 → 재생 중 높이가 바뀌지 않게
			LINES.forEach(([, k]) => k && FX[k]());
			box.style.minHeight = box.offsetHeight + "px";
			reset();
			const tl = gsap.timeline({ repeat: -1, paused: true });
			tl.to({}, { duration: 0.8 });
			LINES.forEach(([, k], i) => {
				tl.add(() => lines[i].classList.add("is-on"))
					.to(lines[i], { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "steps(28)" })
					.add(() => {
						lines[i].classList.remove("is-on");
						if (k) FX[k]();
					})
					.to({}, { duration: k ? 0.6 : 0.15 });
			});
			tl.to({}, { duration: 3 }).add(reset);
			control.setTimeline(tl);
			return () => {
				control.setTimeline(null);
				gsap.killTweensOf(gaCount);
			};
		},
		{ scope: ref },
	);

	return (
		<DemoBox kind="seo" control={control} boxRef={ref}>
			<pre className="seo_code">
				<code>
					{LINES.map(([html], i) => (
						<span className="ln" key={i} dangerouslySetInnerHTML={{ __html: html }} />
					))}
				</code>
			</pre>
			<div className="seo_prev">
				<div className="seo_site">
					<i></i>example.com
				</div>
				<div className="seo_body">
					<div className="seo_txt">
						<p className="seo_title"></p>
						<p className="seo_desc"></p>
						<p className="seo_rate">
							★★★★★ <b>4.9</b> · 리뷰 128
						</p>
					</div>
					<div className="seo_thumb"></div>
				</div>
				<ul className="seo_tools">
					<li data-tool="gsc">Search Console</li>
					<li data-tool="nsa">Search Advisor</li>
					<li data-tool="ga">
						Analytics <b>0</b>
					</li>
				</ul>
			</div>
		</DemoBox>
	);
}
