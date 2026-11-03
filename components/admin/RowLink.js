"use client";

import { useRouter } from "next/navigation";

// 표의 줄 전체를 누르면 상세 화면으로 (안의 링크 · 버튼은 그대로)
export default function RowLink({ href, children }) {
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
