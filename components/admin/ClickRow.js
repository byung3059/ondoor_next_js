"use client";

import { useRouter } from "next/navigation";

// 표의 줄 전체를 누르면 상세 화면으로 (안의 링크 · 버튼은 그대로, 글자를 드래그해 고르는 중이면 이동하지 않음)
export default function ClickRow({ href, children }) {
	const router = useRouter();
	return (
		<tr
			onClick={(e) => {
				if (e.target.closest("a, button") || window.getSelection()?.toString()) return;
				router.push(href);
			}}
		>
			{children}
		</tr>
	);
}
