"use client";

import { usePopup } from "./PopupProvider";

// 팝업 여는 링크 (푸터 개인정보처리방침 · 이용약관, 상담 폼 [보기])
export default function PopupLink({ name, children, ...rest }) {
	const { open } = usePopup();
	return (
		<a
			href={`#pop_${name}`}
			data-pop-open={name}
			onClick={(e) => {
				e.preventDefault();
				open(name, e.currentTarget);
			}}
			{...rest}
		>
			{children}
		</a>
	);
}
