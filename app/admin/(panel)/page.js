import Link from "next/link";
import { headers } from "next/headers";
import AdminPage from "@/components/admin/AdminPage";
import VisitCard from "@/components/admin/VisitCard";
import CalendarCard from "@/components/admin/CalendarCard";
import DashMore from "@/components/admin/DashMore";
import StatusBadge from "@/components/admin/StatusBadge";
import Icon from "@/components/admin/Icon";
import { SHORTCUTS } from "@/lib/admin-menu";
import { BLOG_URL } from "@/lib/site";
import { formatDateTime, formatShort } from "@/lib/format";
import { blogPosts, calendar, contactSummary, loginInfo, pendingTasks, rankings, requestIp, serverInfo, today, todaySummary, visitStats } from "@/lib/dashboard";

export const metadata = { title: "대시보드" };

const num = (v) => Number(v || 0).toLocaleString("ko-KR");

// 순위 목록: 이름 | 값, 아래 막대 (가장 많은 것 = 100%)
function Rank({ rows, unit = "회", color = "", empty }) {
	if (!rows.length) return <p className="adm_empty">{empty}</p>;
	const max = Math.max(...rows.map((r) => r.n));
	return (
		<ul className={`dash_rank ${color}`}>
			{rows.map((r) => (
				<li key={r.key || r.name}>
					<span className="dash_rank_name" title={r.title || r.name}>
						{r.label || r.name}
						{r.sub && <small>{r.sub}</small>}
					</span>
					<span className="dash_rank_value">
						{num(r.n)}
						{unit}
					</span>
					<span className="dash_rank_track" aria-hidden="true">
						<i style={{ width: `${Math.max(4, (r.n / max) * 100)}%` }}></i>
					</span>
				</li>
			))}
		</ul>
	);
}

/* 관리자 대시보드 (원본: 그누보드 관리자 테마 extend/adm_theme/skin/dashboard.php)
   1행: 접속 통계 + 접속 기기
   2행: 캘린더 | 관리자님 | 바로가기
   3행: 상담 문의(원본 1:1 문의) | 블로그 최근 글(원본 최근게시물) | 서버정보
   4행: 유입 경로 | 많이 본 페이지 | AI·검색 봇 (원본 4행 주문현황 자리 — 쇼핑몰이 없어 그누보드 트래픽 현황의 항목으로) */
export default async function AdminDashboard() {
	const t = today();
	const ip = requestIp(await headers());
	const [visit, cal, sum, tasks, login, contacts, blog, server, rank] = await Promise.all([
		visitStats(),
		calendar(t.slice(0, 7)),
		todaySummary(),
		pendingTasks(),
		loginInfo(ip),
		contactSummary(4),
		blogPosts({ perPage: 5 }),
		serverInfo(),
		rankings(),
	]);

	return (
		<AdminPage title="대시보드" hideTitle>
			<div className="dash" id="adm_dashboard">
				<VisitCard data={visit} today={t} />

				<CalendarCard initial={cal} today={t} />

				<section className="adm_card dash_hello">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">
								안녕하세요, <b>관리자</b>님!
							</h2>
						</div>
					</div>
					<p className="dash_hello_text">
						오늘은 <b>{num(sum.visit)}명</b>의 방문자가 있었고,
						<br />
						<b>{num(sum.contact)}건</b>의 상담 문의가 들어왔어요.
					</p>
					<ul className="dash_tasks">
						{tasks.map((task) => (
							<li key={task.label}>
								<Link href={task.href} className={`dash_task${task.count ? "" : " is-zero"}`}>
									<span className="dash_task_name">{task.label}</span>
									<span className="dash_task_count">
										<b>{num(task.count)}</b>
										{task.unit || "건"}
									</span>
								</Link>
							</li>
						))}
					</ul>
					{login && (
						<p className="dash_login">
							<Icon name="schedule" />
							<span>
								금일 첫 접속 {formatDateTime(login.time).slice(11)} · IP {login.ip}
							</span>
							{login.changed && (
								<span className="adm_badge is-danger" title={`지금 접속한 IP: ${login.currentIp}`}>
									다른 IP 접속
								</span>
							)}
						</p>
					)}
				</section>

				<section className="adm_card dash_shortcut">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">바로가기</h2>
						</div>
					</div>
					<ul className="dash_shortcuts">
						{SHORTCUTS.map(([label, href, icon, ext]) => (
							<li key={label}>
								{ext || href.startsWith("/admin/export") ? (
									<a href={href} className="dash_shortcut_link" {...(ext ? { target: "_blank", rel: "noopener" } : {})}>
										<span className="dash_shortcut_icon">
											<Icon name={icon} />
										</span>
										<span className="dash_shortcut_name">{label}</span>
									</a>
								) : (
									<Link href={href} className="dash_shortcut_link">
										<span className="dash_shortcut_icon">
											<Icon name={icon} />
										</span>
										<span className="dash_shortcut_name">{label}</span>
									</Link>
								)}
							</li>
						))}
					</ul>
				</section>

				<section className="adm_card">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">상담 문의</h2>
						</div>
						<DashMore href="/admin/contacts" label="상담 문의 전체" />
					</div>
					<div className="dash_qa_sum">
						<p>
							<strong className="dash_qa_wait">{num(contacts.wait)}</strong> 건 처리 대기
						</p>
						<span className="adm_badge">전체 {num(contacts.total)}건</span>
					</div>
					{contacts.list.length ? (
						<ul className="dash_list">
							{contacts.list.map((c) => (
								<li key={c.id}>
									<Link href={`/admin/contacts/${c.id}`} className="dash_list_link">
										<span className="dash_list_row">
											<span className="dash_list_title">{c.quick ? `${c.name}님 · 빠른 상담` : `${c.name}님 · ${c.job} · ${c.budget}`}</span>
											<StatusBadge status={c.status} />
										</span>
										<span className="dash_list_meta">
											<span>{c.quick ? "오른쪽 아래 문의칸" : "상담 문의 폼"}</span>
											<time>{formatShort(c.created_at)}</time>
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="adm_empty">들어온 문의가 없습니다.</p>
					)}
				</section>

				<section className="adm_card">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">블로그 최근 글</h2>
						</div>
						<DashMore href={BLOG_URL} label="블로그 전체" external />
					</div>
					{blog?.length ? (
						<ul className="dash_list">
							{blog.map((p) => (
								<li key={p.id}>
									<a href={p.link} target="_blank" rel="noopener" className="dash_list_link">
										<span className="dash_list_title">{p.title}</span>
										<span className="dash_list_meta">
											<span>블로그</span>
											<time>{p.date.slice(0, 10)}</time>
										</span>
									</a>
								</li>
							))}
						</ul>
					) : (
						<p className="adm_empty">{blog ? "등록된 글이 없습니다." : "블로그 글을 불러오지 못했습니다."}</p>
					)}
				</section>

				<section className="adm_card">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">서버정보</h2>
						</div>
						<DashMore href="https://vercel.com/dashboard" label="Vercel" external />
					</div>
					<dl className="dash_server">
						{Object.entries(server).map(([k, v]) => (
							<div key={k}>
								<dt>{k}</dt>
								<dd>{v}</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="adm_card">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">유입 경로</h2>
							<p className="adm_card_desc">최근 7일 · 직접 유입 {num(rank.direct)}회</p>
						</div>
					</div>
					<Rank rows={rank.refs} empty="다른 사이트에서 들어온 방문이 아직 없습니다." />
				</section>

				<section className="adm_card">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">많이 본 페이지</h2>
							<p className="adm_card_desc">최근 7일 페이지 조회</p>
						</div>
					</div>
					<Rank rows={rank.pages.map((p) => ({ ...p, label: p.title ? p.title.split(" | ")[0] : p.name, sub: p.name }))} color="is-c2" empty="아직 페이지 조회가 없습니다." />
				</section>

				<section className="adm_card" id="bots">
					<div className="adm_card_head">
						<div>
							<h2 className="adm_card_title">AI·검색 봇</h2>
							<p className="adm_card_desc">최근 7일 접속</p>
						</div>
					</div>
					<Rank rows={rank.bots.map((b) => ({ ...b, sub: `${b.owner} · ${b.kind}` }))} color="is-c3" empty="아직 봇 접속이 없습니다." />
				</section>
			</div>
		</AdminPage>
	);
}
