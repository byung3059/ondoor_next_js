import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { clientIp, contactBudgets, contactJobs, mem, readFormToken } from "@/lib/contact";

/* 상담 문의 저장 (원본: skin/latest/contact/contact_update.php — db_list 게시판에 비밀글로 저장)
   - 이 버전은 DB 대신 data/contacts.json에 쌓음 (최근 것이 위)
   - 스팸 방지: 폼 토큰 · 숨김 칸 · 3초 안에 보내면 거부 · 30초 안에 다시 보내면 거부 · 같은 IP 10분 3건 · 자동등록방지
   - fetch(ajax=1)로 오면 JSON { ok, msg, code }, 아니면 알림창 후 메인으로 (code = 'captcha'면 폼이 자동등록방지 문제를 새로 받음) */
const FILE = path.join(process.cwd(), "data", "contacts.json");

async function readAll() {
	try {
		return JSON.parse(await readFile(FILE, "utf8"));
	} catch {
		return [];
	}
}

// 태그 제거 · 길이 자르기
const val = (fd, key, max) =>
	Array.from(String(fd.get(key) ?? "").trim().replace(/<[^>]*>/g, ""))
		.slice(0, max)
		.join("");

export async function POST(req) {
	const fd = await req.formData();
	const isAjax = !!fd.get("ajax");

	const reply = (ok, msg, code = "") => {
		if (isAjax) return Response.json({ ok, msg, code });
		// 폼을 스크립트 없이 보냈을 때: 원본 alert()처럼 알림창 → 성공이면 메인, 실패면 뒤로
		const go = ok ? 'location.href="/"' : "history.back()";
		return new Response(`<!doctype html><meta charset="utf-8"><script>alert(${JSON.stringify(msg)});${go};</script>`, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	};

	const ip = clientIp(req);
	const now = Date.now();

	// 스팸 방지
	const shown = readFormToken(fd.get("token"));
	if (!shown) return reply(false, "페이지를 새로고침한 뒤 다시 시도해 주세요.");
	if (fd.get("hp_url")) return reply(true, "상담 신청이 접수되었습니다."); // 숨김 칸을 채운 자동 등록 → 저장하지 않고 성공처럼
	if (now - shown < 3000) return reply(false, "잠시 후 다시 시도해 주세요.");
	const last = mem.lastSent.get(ip);
	if (last && now - last < 30_000) return reply(false, "이미 접수되었습니다. 잠시 후 다시 시도해 주세요.");
	// 같은 IP는 10분에 3건, 전체는 10분에 30건까지
	const list = await readAll();
	const recent = list.filter((r) => now - Date.parse(r.datetime) < 600_000);
	if (recent.filter((r) => r.ip === ip).length >= 3 || recent.length >= 30) return reply(false, "접수가 많아 잠시 후 다시 시도해 주세요.");

	// 빠른 상담 (오른쪽 아래 문의칸): 이름 · 연락처 · 문의내용만 — 직종 · 예산 · 자동등록방지 없음
	const quick = !!fd.get("quick");

	// 입력값 확인
	const name = val(fd, "wr_name", 20);
	const tel = val(fd, "wr_1", 20);
	let job = val(fd, "wr_2", 50);
	let budget = val(fd, "wr_3", 50);
	// "직접 입력"을 골랐으면 아래 입력 칸 값으로
	const jobEtc = job === "__etc";
	const budgetEtc = budget === "__etc";
	if (jobEtc) job = val(fd, "wr_2_etc", 30);
	if (budgetEtc) budget = val(fd, "wr_3_etc", 30);
	const content = val(fd, "wr_content", 2000);

	if (name === "") return reply(false, "이름을 입력해 주세요.");
	if (!/^[0-9+\-\s()]{8,20}$/.test(tel)) return reply(false, "연락처를 정확히 입력해 주세요.");
	if (quick) {
		job = "빠른 상담"; // 목록에서 어디서 온 문의인지 보이게
		budget = "";
	} else {
		if (jobEtc ? job === "" : !contactJobs.includes(job)) return reply(false, jobEtc ? "직종을 입력해 주세요." : "직종을 선택해 주세요.");
		if (budgetEtc ? budget === "" : !contactBudgets.includes(budget)) return reply(false, budgetEtc ? "예산을 입력해 주세요." : "예산을 선택해 주세요.");
	}
	if (content === "") return reply(false, "문의내용을 입력해 주세요.");
	if (!fd.get("agree")) return reply(false, "개인정보처리방침에 동의해 주세요.");

	// 자동등록방지: 폼에서 문제를 풀면 받은 통과 표시를 확인 (한 번 쓰면 사라짐, 10분 안에)
	// 다른 입력 확인을 다 통과한 뒤에 확인 → 입력만 고쳐서 다시 보낼 때 문제를 또 풀지 않아도 됨
	if (!quick) {
		const res = String(fd.get("t2-captcha-response") || "");
		const ok = /^t2_success_[a-f0-9]{64}$/.test(res) && mem.captchaOk.get(res);
		mem.captchaOk.delete(res);
		if (!ok || ok.ip !== ip || now - ok.time > 10 * 60 * 1000) return reply(false, "자동등록방지 문제를 풀어 주세요.", "captcha");
	}

	// 저장
	const subject = quick ? `[빠른 상담] ${name}` : `[상담] ${name} · ${job} · ${budget}`;
	const id = (list.reduce((m, r) => Math.max(m, r.id || 0), 0) || 0) + 1;
	const datetime = new Date(now).toISOString();
	list.unshift({ id, subject, name, tel, job, budget, content, ip, datetime, agreedAt: datetime });
	try {
		await mkdir(path.dirname(FILE), { recursive: true });
		await writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
	} catch {
		return reply(false, "접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
	}

	mem.lastSent.set(ip, now);
	return reply(true, "상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.");
}
