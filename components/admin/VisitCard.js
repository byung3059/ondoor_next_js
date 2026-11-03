"use client";

import { useState } from "react";
import { LineChart, DonutChart, numberFormat } from "./charts";

const PERIOD_TEXT = { today: "일간", 7: "주간", 30: "월간" };
const pad2 = (n) => String(n).padStart(2, "0");
const hourLabels = Array.from({ length: 24 }, (_, h) => `${pad2(h)}시`);
const dayLabel = (d) => `${d.slice(5, 7)}.${d.slice(8, 10)}`;

function rangeText(period, today) {
	if (period === "today") return today;
	const d = new Date(`${today}T00:00:00`);
	d.setDate(d.getDate() - (Number(period) - 1));
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ~ ${today}`;
}

// 일간(오늘 시간별) / 주간(최근 7일) / 월간(최근 30일)
function PeriodTabs({ value, onChange }) {
	return (
		<div className="adm_segment" role="tablist">
			{Object.entries(PERIOD_TEXT).map(([v, label]) => (
				<button key={v} type="button" role="tab" aria-selected={value === v} className={value === v ? "is-active" : undefined} onClick={() => onChange(v)}>
					{label}
				</button>
			))}
		</div>
	);
}

/* 접속 통계 + 접속 기기 (원본 대시보드 1행, adm_dashboard.js의 initVisit)
   방문자 = 브라우저 세션당 1건 (사이트의 Tracker), 기기: PC · 모바일 · AI·검색 봇 (봇은 proxy.js가 기록) */
export default function VisitCard({ data, today }) {
	const [period, setPeriod] = useState("today");
	let labels, tipLabels, values;
	if (period === "today") {
		labels = hourLabels;
		tipLabels = labels.map((l) => `${today} ${l}`);
		values = data.hourly;
	} else {
		const days = Object.keys(data.daily).sort().slice(-Number(period));
		labels = days.map(dayLabel);
		tipLabels = days;
		values = days.map((d) => data.daily[d]);
	}
	const dev = data.device[period] || { pc: 0, mobile: 0, bot: 0 };
	const total = dev.pc + dev.mobile + dev.bot;

	return (
		<section className="adm_card dash_span3 dash_split dash_visit" id="visit">
			<div className="dash_split_main">
				<div className="adm_card_head">
					<div>
						<h2 className="adm_card_title">접속 통계</h2>
						<p className="adm_card_desc">{rangeText(period, today)}</p>
					</div>
					<div className="adm_card_tools">
						<PeriodTabs value={period} onChange={setPeriod} />
					</div>
				</div>
				<LineChart title="접속 통계" labels={labels} tipLabels={tipLabels} format={(v) => numberFormat(v) + "명"} series={[{ name: "방문자", color: "var(--adm-c1)", values }]} />
			</div>
			<div className="dash_split_side">
				<div className="adm_card_head">
					<div>
						<h2 className="adm_card_title">접속 기기</h2>
						<p className="adm_card_desc">{PERIOD_TEXT[period]} 방문자</p>
					</div>
					<div className="adm_card_tools">
						{/* 640px 이하에서만 보임: 접속 통계 그래프를 숨기므로 기간 선택을 여기에 둠 */}
						<div className="dash_visit_side_period">
							<PeriodTabs value={period} onChange={setPeriod} />
						</div>
					</div>
				</div>
				<div className="adm_donut_wrap is-stack">
					<DonutChart
						title="접속 기기"
						total={total}
						caption={`${PERIOD_TEXT[period]} 방문자`}
						items={[
							{ label: "PC", value: dev.pc, color: "var(--adm-c1)" },
							{ label: "모바일", value: dev.mobile, color: "var(--adm-c2)" },
							{ label: "AI·검색 봇", value: dev.bot, color: "var(--adm-c3)" },
						]}
					/>
				</div>
			</div>
		</section>
	);
}
