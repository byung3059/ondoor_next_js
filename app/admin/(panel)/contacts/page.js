import Link from "next/link";
import AdminPage from "@/components/admin/AdminPage";
import StatusBadge from "@/components/admin/StatusBadge";
import ClickRow from "@/components/admin/ClickRow";
import Icon from "@/components/admin/Icon";
import { listContacts, PAGE_SIZE, STATUS } from "@/lib/contacts";
import { formatShort } from "@/lib/format";

export const metadata = { title: "상담 문의" };

// 주소 만들기: 지금 조건에서 일부만 바꿔서
const qs = (base, patch) => {
	const p = new URLSearchParams();
	const v = { ...base, ...patch };
	for (const k of ["status", "date", "q", "page"]) if (v[k] && !(k === "page" && Number(v[k]) === 1)) p.set(k, v[k]);
	const s = p.toString();
	return s ? `?${s}` : "";
};

/* 상담 문의 목록 (원본: 그누보드 관리자 > db_list 게시판) — 최신순 20개씩, 상태 탭 · 검색 · 접수일 · CSV 내려받기 */
export default async function AdminContacts({ searchParams }) {
	const sp = await searchParams;
	const status = STATUS[sp.status] ? sp.status : "";
	const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || "") ? sp.date : "";
	const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 50) : "";
	const page = Math.max(1, parseInt(sp.page, 10) || 1);
	const { rows, total, byStatus, all } = await listContacts({ status, q, date, page });
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const cur = { status, date, q, page };

	return (
		<AdminPage title="상담 문의">
			<div className="btn_fixed_top">
				<a className="adm_btn" href={`/admin/export${qs(cur, { page: 1 })}`}>
					<Icon name="download" />
					CSV 내려받기
				</a>
			</div>

			{sp.deleted && <p className="ct_note">문의를 삭제했습니다.</p>}

			<div className="ct_tools">
				<nav className="ct_tabs" aria-label="처리 상태">
					<Link href={`/admin/contacts${qs(cur, { status: "", page: 1 })}`} className={!status ? "is-active" : undefined}>
						전체<b>{all}</b>
					</Link>
					{Object.entries(STATUS).map(([k, label]) => (
						<Link key={k} href={`/admin/contacts${qs(cur, { status: k, page: 1 })}`} className={status === k ? "is-active" : undefined}>
							{label}
							<b>{byStatus[k] || 0}</b>
						</Link>
					))}
				</nav>
				<form className="ct_search" action="/admin/contacts">
					{status && <input type="hidden" name="status" value={status} />}
					{date && <input type="hidden" name="date" value={date} />}
					<input className="frm_input" type="search" name="q" defaultValue={q} placeholder="이름 · 연락처 · 내용 · 메모 검색" />
					<button className="adm_btn is-primary" type="submit">
						검색
					</button>
				</form>
			</div>

			{date && (
				<p className="local_desc">
					<b>{date}</b> 접수한 문의만 보는 중입니다. <Link href={`/admin/contacts${qs(cur, { date: "", page: 1 })}`}>전체 날짜 보기</Link>
				</p>
			)}

			<div className="tbl_head01 tbl_wrap">
				<table className="ct_list">
					<caption className="sound_only">상담 문의 목록</caption>
					<thead>
						<tr>
							<th scope="col">접수</th>
							<th scope="col">상태</th>
							<th scope="col">이름</th>
							<th scope="col">연락처</th>
							<th scope="col">직종 · 예산</th>
							<th scope="col">문의내용</th>
						</tr>
					</thead>
					<tbody>
						{rows.length ? (
							rows.map((r) => (
								<ClickRow key={r.id} href={`/admin/contacts/${r.id}`}>
									<td className="td_date">{formatShort(r.created_at)}</td>
									<td>
										<StatusBadge status={r.status} />
									</td>
									<td className="td_name">
										<Link href={`/admin/contacts/${r.id}`}>{r.name}</Link>
									</td>
									<td className="td_tel">
										<a href={`tel:${r.tel.replace(/[^0-9+]/g, "")}`}>{r.tel}</a>
									</td>
									<td>{r.quick ? <span className="adm_badge">빠른 상담</span> : `${r.job} · ${r.budget}`}</td>
									<td className="td_snip">{r.content}</td>
								</ClickRow>
							))
						) : (
							<tr>
								<td colSpan={6} className="empty_table">
									{q || status || date ? "조건에 맞는 문의가 없습니다." : "아직 들어온 문의가 없습니다."}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{pages > 1 && (
				<nav className="pg_wrap" aria-label="쪽 번호">
					<span className="pg">
						{Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
							n === page ? (
								<strong key={n} className="pg_current" aria-current="page">
									{n}
								</strong>
							) : (
								<Link key={n} className="pg_page" href={`/admin/contacts${qs(cur, { page: n })}`}>
									{n}
								</Link>
							),
						)}
					</span>
				</nav>
			)}
		</AdminPage>
	);
}
