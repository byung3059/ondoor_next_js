"use client";

import { useEffect, useRef, useState } from "react";

let closeOpen = null; // 지금 열린 셀렉트 닫기 (다른 셀렉트를 열면 닫힘)

/* 셀렉트 박스 커스텀 (원본: js/contact_form.js)
   원래 select는 값 저장 · 필수 검사용으로 같은 자리에 투명하게 남기고, 버튼 + 목록을 따로 그림
   클릭 · 키보드(↑↓ 이동, Enter · Space 선택, Esc · Tab 닫기), 바깥을 누르면 닫힘
   options: 값 목록 ("직접 입력"은 맨 끝에 __etc로 붙음) */
export default function CfSelect({ id, name, options, value, onChange, required }) {
	const items = [...options.map((v) => [v, v]), ["__etc", "직접 입력"]];
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const wrapRef = useRef(null),
		btnRef = useRef(null),
		listRef = useRef(null);

	const close = () => setOpen(false);
	const show = () => {
		if (closeOpen && closeOpen !== close) closeOpen();
		closeOpen = close;
		setOpen(true);
		move(Math.max(0, items.findIndex(([v]) => v === value)), true);
	};
	const move = (i, scroll) => {
		const a = Math.max(0, Math.min(items.length - 1, i));
		setActive(a);
		if (scroll) requestAnimationFrame(() => listRef.current?.children[a]?.scrollIntoView({ block: "nearest" }));
	};
	const pick = (i) => {
		onChange(items[i][0]);
		close();
		btnRef.current?.focus();
	};

	// 바깥을 누르면 닫힘
	useEffect(() => {
		if (!open) return;
		const onDoc = (e) => !wrapRef.current?.contains(e.target) && close();
		document.addEventListener("click", onDoc);
		return () => {
			document.removeEventListener("click", onDoc);
			if (closeOpen === close) closeOpen = null;
		};
	});

	const onKey = (e) => {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			if (!open) return show();
			move(active + (e.key === "ArrowDown" ? 1 : -1), true);
		} else if ((e.key === "Enter" || e.key === " ") && open) {
			e.preventDefault();
			pick(active);
		} else if (e.key === "Escape" && open) {
			e.preventDefault();
			e.stopPropagation(); // 문의칸 · 팝업까지 닫히지 않게
			close();
		} else if (e.key === "Tab") close();
	};

	const cur = items.find(([v]) => v === value);
	return (
		<div className={open ? "cf_select is-open" : "cf_select"} ref={wrapRef}>
			<select id={id} name={name} required={required} value={value} onChange={(e) => onChange(e.target.value)} tabIndex={-1} aria-hidden="true">
				<option value="">선택해 주세요</option>
				{items.map(([v, label]) => (
					<option key={v} value={v}>
						{label}
					</option>
				))}
			</select>
			<button
				type="button"
				className={value ? "cf_select_btn" : "cf_select_btn is-empty"}
				id={`${id}_btn`}
				aria-haspopup="listbox"
				aria-expanded={open}
				ref={btnRef}
				onClick={() => (open ? close() : show())}
				onKeyDown={onKey}
			>
				{cur ? cur[1] : "선택해 주세요"}
			</button>
			<ul className="cf_select_list" role="listbox" data-lenis-prevent="" ref={listRef}>
				{items.map(([v, label], i) => (
					<li
						key={v}
						role="option"
						data-value={v}
						aria-selected={v === value}
						className={i === active ? "is-active" : undefined}
						onClick={() => pick(i)}
						onMouseMove={() => i !== active && move(i, false)}
					>
						{label}
					</li>
				))}
			</ul>
		</div>
	);
}
