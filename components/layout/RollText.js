// 글자를 한 글자씩 나눔 → 마우스를 올리면 차례로 위로 굴러 올라가고 같은 글자가 아래에서 올라옴 (CSS .roll, --i: 순서, data-ch: 같은 글자)
// as: 감싸는 태그 (메뉴 span · 카드 제목 b), 읽기 프로그램에는 aria-label로 전체 글자를 읽힘
export default function RollText({ as: Tag = "span", className = "roll", text, child = "i" }) {
	const Child = child;
	return (
		<Tag className={className || undefined} aria-label={text}>
			{Array.from(text).map((ch, i) => (
				<Child key={i} style={{ "--i": i }} data-ch={ch} aria-hidden="true">
					{ch}
				</Child>
			))}
		</Tag>
	);
}
