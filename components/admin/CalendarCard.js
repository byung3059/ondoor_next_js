"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { BLOG_URL } from "@/lib/site";

// 캘린더 표시 종류 (원본: 게시물 · 1:1문의 · 주문 · 회원가입)
const CAL_TYPES = {
	contact: { label: "상담 문의", color: "var(--adm-c1)", href: (d) => `/admin/contacts?date=${d}` },
	done: { label: "처리 완료", color: "var(--adm-c2)" },
	blog: { label: "블로그 글", color: "var(--adm-c3)", href: () => BLOG_URL, external: true },
};
const pad2 = (n) => String(n).padStart(2, "0");
const ymOffset = (ym, diff) => {
	const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + diff, 1);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/* 캘린더 (원본 adm_dashboard.js의 initCalendar)
   - 처음엔 오늘이 선택된 상태, 날짜를 누르면 그날의 건수를 카드 안 팝업으로 (닫기 · 바깥 · Esc)
   - 앞뒤 달의 날짜를 누르면 그 달로 넘어간 뒤 팝업 */
export default function CalendarCard({ initial, today }) {
	const [cache, setCache] = useState({ [initial.ym]: initial });
	const [current, setCurrent] = useState(initial.ym);
	const [selected, setSelected] = useState(today);
	const [popup, setPopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const cacheRef = useRef(cache);
	cacheRef.current = cache;

	const load = async (ym) => {
		setError(false);
		if (cacheRef.current[ym]) return setCurrent(ym);
		setLoading(true);
		try {
			const res = await fetch(`/admin/api/calendar?ym=${encodeURIComponent(ym)}`, { cache: "no-store" });
			const json = await res.json();
			setCache((c) => ({ ...c, [json.ym]: json }));
			setCurrent(json.ym);
		} catch {
			setError(true);
			setPopup(true);
		}
		setLoading(false);
	};

	useEffect(() => {
		const onKey = (e) => e.key === "Escape" && setPopup(false);
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const month = cache[current] || { days: {}, types: Object.keys(CAL_TYPES) };
	const y = Number(current.slice(0, 4)),
		m = Number(current.slice(5, 7)) - 1;
	const first = new Date(y, m, 1);
	const start = new Date(y, m, 1 - first.getDay());
	const weeks = Math.ceil((first.getDay() + new Date(y, m + 1, 0).getDate()) / 7);
	const cells = Array.from({ length: weeks * 7 }, (_, i) => {
		const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
		const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
		return { d, key, out: d.getMonth() !== m, info: d.getMonth() === m ? month.days[key] : null };
	});

	const pick = (key) => {
		setSelected(key);
		setPopup(true);
		if (key.slice(0, 7) !== current) load(key.slice(0, 7));
	};
	const info = (popup && !error && cache[selected.slice(0, 7)]?.days[selected]) || {};

	return (
		<section className={`adm_card dash_calendar${loading ? " is-loading" : ""}`}>
			<div className="adm_card_head">
				<div>
					<h2 className="adm_card_title">캘린더</h2>
					<p className="adm_card_desc dash_cal_title">
						{y}년 {m + 1}월
					</p>
				</div>
				<div className="adm_card_tools">
					<button
						type="button"
						className="adm_btn"
						onClick={() => {
							setPopup(false);
							setSelected(today);
							load(today.slice(0, 7));
						}}
					>
						오늘
					</button>
					<div className="adm_btn_group">
						<button type="button" className="adm_btn is-icon" data-cal="prev" title="이전 달" onClick={() => (setPopup(false), load(ymOffset(current, -1)))}>
							<Icon name="chevron_left" />
							<span className="sound_only">이전 달</span>
						</button>
						<button type="button" className="adm_btn is-icon" data-cal="next" title="다음 달" onClick={() => (setPopup(false), load(ymOffset(current, 1)))}>
							<Icon name="chevron_right" />
							<span className="sound_only">다음 달</span>
						</button>
					</div>
				</div>
			</div>
			<div className="adm_legend">
				{Object.values(CAL_TYPES).map((t) => (
					<span key={t.label}>
						<i style={{ background: t.color }}></i>
						{t.label}
					</span>
				))}
			</div>
			<ul className="dash_cal_week" aria-hidden="true">
				{["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
					<li key={w} className={i === 0 ? "is-sun" : i === 6 ? "is-sat" : undefined}>
						{w}
					</li>
				))}
			</ul>
			<ul className="dash_cal_days">
				{cells.map(({ d, key, out, info: day }) => (
					<li
						key={key}
						className={[
							"dash_cal_day",
							out && "is-out",
							d.getDay() === 0 && "is-sun",
							d.getDay() === 6 && "is-sat",
							key === today && "is-today",
							key === selected && "is-selected",
						]
							.filter(Boolean)
							.join(" ")}
					>
						<button type="button" onClick={() => pick(key)}>
							<span className="dash_cal_num">{d.getDate()}</span>
							<span className="dash_cal_dots">
								{day &&
									Object.entries(CAL_TYPES).map(([k, t]) => (day[k] ? <i key={k} style={{ background: t.color }} title={`${t.label} ${day[k]}`}></i> : null))}
							</span>
						</button>
					</li>
				))}
			</ul>
			<div className="dash_cal_pop" hidden={!popup} onClick={(e) => !e.target.closest(".dash_cal_pop_box") && setPopup(false)}>
				{popup && (
					<div className="dash_cal_pop_box" role="dialog" aria-modal="false" aria-label="날짜별 세부정보">
						<button type="button" className="adm_icon_btn dash_cal_pop_close" title="닫기" onClick={() => setPopup(false)}>
							<Icon name="close" />
							<span className="sound_only">닫기</span>
						</button>
						{error ? (
							<p className="dash_cal_pop_msg">캘린더 정보를 불러오지 못했습니다.</p>
						) : (
							<>
								<strong className="dash_cal_detail_title">{selected}</strong>
								<ul>
									{Object.entries(CAL_TYPES).map(([k, t]) => {
										const n = info[k] || 0;
										const href = t.href?.(selected);
										return (
											<li key={k}>
												<i style={{ background: t.color }}></i>
												<span>{t.label}</span>
												{href ? (
													t.external ? (
														<a href={href} target="_blank" rel="noopener">
															<b>{n}</b>건
														</a>
													) : (
														<Link href={href}>
															<b>{n}</b>건
														</Link>
													)
												) : (
													<b>{n}건</b>
												)}
											</li>
										);
									})}
								</ul>
							</>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
