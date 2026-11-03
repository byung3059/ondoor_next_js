/* 글자 · 단어 나누기 — 원본은 스크립트가 실행 중에 DOM을 바꿨지만, 여기선 처음부터 나뉜 모양으로 그림
   (React가 그린 DOM을 스크립트가 바꾸지 않아야 페이지를 오가도 안전) */

// 글자마다 <i> — 띄어쓰기는 &nbsp; 글자로 (We Are 제목 · 왼쪽 강점 제목)
export function Chars({ text }) {
	return Array.from(text).map((ch, i) => <i key={i}>{ch === " " ? " " : ch}</i>);
}

// 글자마다 <i>, 띄어쓰기는 글자로 감싸지 않음 (브랜드 설명 — 줄바꿈 · keep-all 그대로)
export function InlineChars({ text }) {
	const out = [];
	Array.from(text).forEach((ch, i) => out.push(ch === " " ? " " : <i key={i}>{ch}</i>));
	return out;
}

// 단어 .w(줄바꿈 때 안 끊김) > [마스크 .ch] > 글자 i (회사소개 · 상담문의 [data-split] 제목)
export function MaskChars({ text, mask = true }) {
	const out = [];
	text.split(/(\s+)/).forEach((word, wi) => {
		if (!word) return;
		if (!word.trim()) return out.push(" ");
		out.push(
			<span className="w" key={wi}>
				{Array.from(word).map((c, ci) =>
					mask ? (
						<span className="ch" key={ci}>
							<i>{c}</i>
						</span>
					) : (
						<i key={ci}>{c}</i>
					),
				)}
			</span>,
		);
	});
	return out;
}

// 단어마다 .w (소개 문장 — 단어마다 밝아짐), parts: 글자 조각과 { br: "클래스" } — 조각 앞 공백은 띄어쓰기로 남김
export function Words({ parts }) {
	const out = [];
	parts.forEach((p, pi) => {
		if (typeof p !== "string") return out.push(<br key={`b${pi}`} className={p.br || undefined} />);
		if (/^\s/.test(p) && out.length) out.push(" ");
		p.trim()
			.split(/\s+/)
			.forEach((word, i) => {
				if (!word) return;
				if (i) out.push(" ");
				out.push(
					<span className="w" key={`${pi}-${i}`}>
						{word}
					</span>,
				);
			});
	});
	return out;
}
