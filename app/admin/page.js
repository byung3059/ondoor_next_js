import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import RowLink from "@/components/admin/RowLink";
import { requireAdmin } from "@/lib/admin-auth";
import { listContacts, PAGE_SIZE, STATUS } from "@/lib/contacts";
import { formatShort } from "@/lib/format";

export const metadata = { title: "상담 문의" };

// 주소 만들기: 지금 조건에서 일부만 바꿔서
const qs = (base, patch) => {
	const p = new URLSearchParams();
	const v = { ...base, ...patch };
	for (const k of ["status", "q", "page"]) if (v[k] && !(k === "page" && Number(v[k]) === 1)) p.set(k, v[k]);
	const s = p.toString();
	return s ? `?${s}` : "";
};

/* 상담 문의 목록 — 최신순 20개씩, 상태 탭 · 검색 · CSV 내려받기 */
export default async function AdminContacts({ searchParams }) {
	await requireAdmin();
	const sp = await searchParams;
	const status = STATUS[sp.status] ? sp.status : "";
	const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 50) : "";
	const page = Math.max(1, parseInt(sp.page, 10) || 1);
	const { rows, total, byStatus, all } = await listContacts({ status, q, page });
	const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const cur = { status, q, page };

	return (
		<>
			<AdminHeader />
			<main className="adm_main">
				<div className="adm_title">
					<div>
						<h1>상담 문의</h1>
						<p>
							전체 {all}건 · 새 문의 {byStatus.new || 0}건
						</p>
					</div>
					<a className="adm_btn" href={`/admin/export${qs(cur, { page: 1 })}`}>
						CSV 내려받기
					</a>
				</div>

				{sp.deleted && <p className="adm_note">문의를 삭제했습니다.</p>}

				<div className="adm_tools">
					<nav className="adm_tabs" aria-label="상태">
						<Link href={`/admin${qs(cur, { status: "", page: 1 })}`} className={!status ? "is-on" : undefined}>
							전체 <b>{all}</b>
						</Link>
						{Object.entries(STATUS).map(([k, label]) => (
							<Link key={k} href={`/admin${qs(cur, { status: k, page: 1 })}`} className={status === k ? "is-on" : undefined}>
								{label} <b>{byStatus[k] || 0}</b>
							</Link>
						))}
					</nav>
					<form className="adm_search" action="/admin">
						{status && <input type="hidden" name="status" value={status} />}
						<input className="adm_input" type="search" name="q" defaultValue={q} placeholder="이름 · 연락처 · 내용 · 메모 검색" />
						<button className="adm_btn" type="submit">
							검색
						</button>
					</form>
				</div>

				<div className="adm_card">
					{rows.length ? (
						<table className="adm_tbl">
							<thead>
								<tr>
									<th>접수</th>
									<th>상태</th>
									<th>이름</th>
									<th>연락처</th>
									<th className="is-hide-m">직종 · 예산</th>
									<th className="is-hide-m">문의내용</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<RowLink key={r.id} href={`/admin/${r.id}`}>
										<td className="is-nowrap is-mute">{formatShort(r.created_at)}</td>
										<td>
											<StatusBadge status={r.status} />
										</td>
										<td className="c_name is-nowrap">
											<Link href={`/admin/${r.id}`}>{r.name}</Link>
										</td>
										<td className="is-nowrap">
											<a href={`tel:${r.tel.replace(/[^0-9+]/g, "")}`}>{r.tel}</a>
										</td>
										<td className="is-hide-m">{r.quick ? <span className="adm_tag">빠른 상담</span> : `${r.job} · ${r.budget}`}</td>
										<td className="is-hide-m c_snip">{r.content}</td>
									</RowLink>
								))}
							</tbody>
						</table>
					) : (
						<p className="adm_empty">{q || status ? "조건에 맞는 문의가 없습니다." : "아직 들어온 문의가 없습니다."}</p>
					)}
				</div>

				{pages > 1 && (
					<nav className="adm_pager" aria-label="쪽 번호">
						{Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
							n === page ? (
								<span key={n} className="is-on" aria-current="page">
									{n}
								</span>
							) : (
								<Link key={n} href={`/admin${qs(cur, { page: n })}`}>
									{n}
								</Link>
							),
						)}
					</nav>
				)}
			</main>
		</>
	);
}
