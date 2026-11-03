import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPage from "@/components/admin/AdminPage";
import StatusBadge from "@/components/admin/StatusBadge";
import DeleteButton from "@/components/admin/DeleteButton";
import Icon from "@/components/admin/Icon";
import { getContact, neighbors, STATUS } from "@/lib/contacts";
import { formatDateTime } from "@/lib/format";
import { saveContact } from "@/app/admin/actions";

export const metadata = { title: "문의 상세" };

/* 문의 상세 — 내용 + 처리 상태 · 메모 저장, 삭제, 최근 · 이전 문의 */
export default async function AdminContact({ params, searchParams }) {
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
		...(c.quick
			? []
			: [
					["직종", c.job],
					["예산", c.budget],
				]),
		["개인정보 동의", formatDateTime(c.agreed_at)],
		["접속 IP", c.ip],
		["완료 처리", c.done_at ? formatDateTime(c.done_at) : "-"],
	];

	return (
		<AdminPage title={`문의 #${c.id}`}>
			<div className="btn_fixed_top">
				<Link className="adm_btn" href="/admin/contacts">
					<Icon name="list" />
					목록
				</Link>
			</div>

			{saved && <p className="ct_note">저장했습니다.</p>}

			<div className="ct_head">
				<h2>
					{c.name} <StatusBadge status={c.status} />
				</h2>
				<div className="adm_btn_group">
					{prev ? (
						<Link className="adm_btn is-sm" href={`/admin/contacts/${prev}`}>
							<Icon name="chevron_left" />
							최근 문의
						</Link>
					) : (
						<button className="adm_btn is-sm" disabled>
							<Icon name="chevron_left" />
							최근 문의
						</button>
					)}
					{next ? (
						<Link className="adm_btn is-sm" href={`/admin/contacts/${next}`}>
							이전 문의
							<Icon name="chevron_right" />
						</Link>
					) : (
						<button className="adm_btn is-sm" disabled>
							이전 문의
							<Icon name="chevron_right" />
						</button>
					)}
				</div>
			</div>

			<div className="ct_detail">
				<section className="adm_card">
					<div className="adm_card_head">
						<h3 className="adm_card_title">문의 내용</h3>
					</div>
					<dl className="ct_info">
						{info.map(([k, v]) => [<dt key={`t${k}`}>{k}</dt>, <dd key={`d${k}`}>{v}</dd>])}
					</dl>
					<p className="ct_content">{c.content}</p>
				</section>

				<aside className="adm_card">
					<div className="adm_card_head">
						<h3 className="adm_card_title">처리</h3>
					</div>
					<form action={saveContact} className="ct_form">
						<input type="hidden" name="id" value={c.id} />
						<div>
							<label htmlFor="ct_status">상태</label>
							<select id="ct_status" name="status" defaultValue={c.status}>
								{Object.entries(STATUS).map(([k, label]) => (
									<option key={k} value={k}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="ct_memo">메모 (관리자만 보임)</label>
							<textarea id="ct_memo" name="memo" defaultValue={c.memo} placeholder="통화 내용, 견적, 다음 연락일 등" />
						</div>
						<button type="submit" className="adm_btn is-primary">
							저장
						</button>
					</form>
					<div className="ct_danger">
						<p>완료 후 1년이 지나면 자동으로 삭제됩니다.</p>
						<DeleteButton id={c.id} name={c.name} />
					</div>
				</aside>
			</div>
		</AdminPage>
	);
}
