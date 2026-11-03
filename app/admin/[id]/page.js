import Link from "next/link";
import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import DeleteButton from "@/components/admin/DeleteButton";
import { requireAdmin } from "@/lib/admin-auth";
import { getContact, neighbors, STATUS } from "@/lib/contacts";
import { formatDateTime } from "@/lib/format";
import { saveContact } from "../actions";

export const metadata = { title: "문의 상세" };

/* 문의 상세 — 내용 + 처리 상태 · 메모 저장, 삭제, 이전 · 다음 문의 */
export default async function AdminContact({ params, searchParams }) {
	await requireAdmin();
	const { id } = await params;
	const { saved } = await searchParams;
	const c = /^\d+$/.test(id) ? await getContact(Number(id)) : null;
	if (!c) notFound();
	const { prev, next } = await neighbors(c);

	const info = [
		["접수", formatDateTime(c.created_at)],
		["이름", c.name],
		["연락처", <a href={`tel:${c.tel.replace(/[^0-9+]/g, "")}`}>{c.tel}</a>],
		["구분", c.quick ? "빠른 상담 (오른쪽 아래 문의칸)" : "상담 문의 폼"],
		...(c.quick ? [] : [["직종", c.job], ["예산", c.budget]]),
		["개인정보 동의", formatDateTime(c.agreed_at)],
		["접속 IP", c.ip],
		["완료 처리", c.done_at ? formatDateTime(c.done_at) : "-"],
	];

	return (
		<>
			<AdminHeader />
			<main className="adm_main">
				<Link href="/admin" className="adm_back">
					← 목록으로
				</Link>
				<div className="adm_title">
					<div>
						<h1>
							{c.name} <StatusBadge status={c.status} />
						</h1>
						<p>문의 #{c.id}</p>
					</div>
					<div className="adm_row">
						{prev ? (
							<Link className="adm_btn" href={`/admin/${prev}`}>
								← 최근 문의
							</Link>
						) : (
							<button className="adm_btn" disabled>
								← 최근 문의
							</button>
						)}
						{next ? (
							<Link className="adm_btn" href={`/admin/${next}`}>
								이전 문의 →
							</Link>
						) : (
							<button className="adm_btn" disabled>
								이전 문의 →
							</button>
						)}
					</div>
				</div>

				{saved && <p className="adm_note">저장했습니다.</p>}

				<div className="adm_detail">
					<section className="adm_card adm_box">
						<h2>문의 내용</h2>
						<dl className="adm_dl">
							{info.map(([k, v]) => [<dt key={`t${k}`}>{k}</dt>, <dd key={`d${k}`}>{v}</dd>])}
						</dl>
						<p className="adm_content">{c.content}</p>
					</section>

					<aside className="adm_card adm_box">
						<h2>처리</h2>
						<form action={saveContact}>
							<input type="hidden" name="id" value={c.id} />
							<div className="adm_field">
								<label htmlFor="adm_status">상태</label>
								<select id="adm_status" name="status" className="adm_select" defaultValue={c.status}>
									{Object.entries(STATUS).map(([k, label]) => (
										<option key={k} value={k}>
											{label}
										</option>
									))}
								</select>
							</div>
							<div className="adm_field">
								<label htmlFor="adm_memo">메모 (관리자만 보임)</label>
								<textarea id="adm_memo" name="memo" className="adm_textarea" defaultValue={c.memo} placeholder="통화 내용, 견적, 다음 연락일 등" />
							</div>
							<button type="submit" className="adm_btn is-primary is-block">
								저장
							</button>
						</form>
						<hr className="adm_sep" />
						<div className="adm_row">
							<span className="adm_small">완료 후 1년이 지나면 자동으로 삭제됩니다.</span>
							<DeleteButton id={c.id} name={c.name} />
						</div>
					</aside>
				</div>
			</main>
		</>
	);
}
