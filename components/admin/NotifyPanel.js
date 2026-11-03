"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import useRailPanel from "./useRailPanel";
import { formatShort } from "@/lib/format";

const STORE_SEEN = "adm_notify_seen";

/* 알림 패널 (원본: 좌측 메뉴 하단 종 아이콘 — 게시물 · 주문 · 1:1 문의 · 회원가입)
   여기선 처리 상태가 '새 문의'인 상담 문의 — 종 위 숫자 = 새 문의 수
   마지막으로 패널을 연 뒤에 들어온 문의는 점(.is-unread)으로 표시 (본 시각은 브라우저에 저장) */
export default function NotifyPanel({ open, onClose, onCount }) {
	const pathname = usePathname();
	const { hidden, closing } = useRailPanel(open);
	const [data, setData] = useState({ count: 0, items: [] });
	const [seen, setSeen] = useState(0);

	// 처음 · 페이지가 바뀔 때 · 패널을 열 때 새로 받음
	useEffect(() => {
		let alive = true;
		fetch("/admin/api/notify", { cache: "no-store" })
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (!alive || !d) return;
				setData(d);
				onCount(d.count);
			})
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, [pathname, open, onCount]);

	useEffect(() => {
		try {
			setSeen(Number(localStorage.getItem(STORE_SEEN)) || 0);
		} catch {}
	}, []);
	// 닫을 때 지금까지 본 것으로
	useEffect(() => {
		if (open || hidden) return;
		const now = Date.now();
		try {
			localStorage.setItem(STORE_SEEN, String(now));
		} catch {}
		setSeen(now);
	}, [open, hidden]);

	return (
		<div className={`adm_notify${closing ? " is-closing" : ""}`} id="adm_notify" role="dialog" aria-label="알림" hidden={hidden}>
			<div className="adm_notify_head">
				<strong className="adm_notify_title">알림</strong>
				<button type="button" className="adm_icon_btn" title="닫기" onClick={onClose}>
					<Icon name="close" />
					<span className="sound_only">알림 닫기</span>
				</button>
			</div>
			<div className="adm_notify_list">
				{data.items.length ? (
					data.items.map((c) => (
						<div key={c.id} className={`adm_notify_item${new Date(c.created_at).getTime() > seen ? " is-unread" : ""}`}>
							<Link href={`/admin/contacts/${c.id}`} className="adm_notify_body" onClick={onClose}>
								<span className="adm_notify_meta">
									<b>{c.quick ? "빠른 상담" : "상담 문의"}</b>
									<time>{formatShort(c.created_at)}</time>
								</span>
								<span className="adm_notify_text">
									{c.name}님 {c.quick ? "" : `· ${c.job} · ${c.budget}`}
								</span>
							</Link>
							<Link href={`/admin/contacts/${c.id}`} className="adm_icon_btn" title="문의 보기" onClick={onClose}>
								<Icon name="chevron_right" />
								<span className="sound_only">문의 보기</span>
							</Link>
						</div>
					))
				) : (
					<p className="adm_notify_empty">
						<Icon name="notifications_off" />
						새 상담 문의가 없습니다.
					</p>
				)}
			</div>
			<div className="adm_notify_foot">
				<span>새 문의 {data.count}건</span>
				<div className="adm_notify_actions">
					<Link href="/admin/contacts?status=new" className="adm_btn is-sm" onClick={onClose}>
						모두 보기
					</Link>
				</div>
			</div>
		</div>
	);
}
