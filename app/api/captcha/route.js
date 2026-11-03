import { clientIp } from "@/lib/contact";
import { checkAnswer, questionToken } from "@/lib/captcha";

/* 상담 폼 자동등록방지 (원본: skin/latest/contact/captcha.php + plugin/t2captcha의 문제 생성 · 정답 확인)
   - act=new   : 새 문제  → { ok, question, token }
     act=check : 정답 확인 → { ok, response } (통과 표시, 상담 저장 때 한 번만 쓰임) 또는 { ok: false, msg }
   - 난이도 normal: 덧셈 · 사칙 · 숫자 패턴 ("수도" 문제는 정답이 항상 같아 원본도 버림)
   - 정답은 서버가 기억하지 않고 토큰 서명에 넣음 (lib/captcha.js) — 문제마다 확인은 한 번 (틀리면 폼이 새 문제를 받음) */
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 너무 잦은 요청 막기: 같은 IP가 1분에 30번까지 (서버 인스턴스마다 따로 셈 — 대략적인 제한)
const rate = (globalThis.__ondoorCapRate ??= new Map());

function makeQuestion() {
	const type = pick(["simple_math", "math", "pattern"]);
	if (type === "simple_math") {
		const a = rand(1, 20),
			b = rand(1, 20);
		return { question: `${a} + ${b} = ?`, answer: a + b };
	}
	if (type === "math") {
		const op = pick(["+", "-", "*"]);
		if (op === "+") {
			const a = rand(10, 50),
				b = rand(10, 50);
			return { question: `${a} + ${b} = ?`, answer: a + b };
		}
		if (op === "-") {
			const a = rand(20, 80),
				b = rand(5, a - 5);
			return { question: `${a} - ${b} = ?`, answer: a - b };
		}
		const a = rand(2, 12),
			b = rand(2, 12);
		return { question: `${a} × ${b} = ?`, answer: a * b };
	}
	// 숫자 패턴: 등차 · 짝수 · 홀수 · 피보나치
	const kind = pick(["arithmetic", "even", "odd", "fibonacci"]);
	let seq, next;
	if (kind === "fibonacci") (seq = [1, 1, 2, 3]), (next = 5);
	else {
		const start = kind === "arithmetic" ? rand(1, 10) : kind === "even" ? rand(1, 5) * 2 : rand(1, 5) * 2 - 1;
		const diff = kind === "arithmetic" ? rand(2, 5) : 2;
		seq = [0, 1, 2, 3].map((i) => start + i * diff);
		next = start + 4 * diff;
	}
	return { question: `다음 숫자 패턴에서 다음에 올 숫자는? ${seq.join(", ")}, ?`, answer: next };
}

const out = (data) => Response.json(data, { headers: { "Cache-Control": "no-store" } });

export async function POST(req) {
	if ((req.headers.get("x-requested-with") || "").toLowerCase() !== "xmlhttprequest") return out({ ok: false, msg: "올바른 방법으로 이용해 주십시오." });

	const ip = clientIp(req);
	const now = Date.now();
	let rl = rate.get(ip);
	if (!rl || now - rl.t > 60_000) rl = { n: 0, t: now };
	rl.n++;
	rate.set(ip, rl);
	if (rate.size > 5000) rate.clear();
	if (rl.n > 30) return out({ ok: false, msg: "잠시 후 다시 시도해 주세요." });

	const fd = await req.formData();
	const act = String(fd.get("act") || "");

	if (act === "new") {
		const q = makeQuestion();
		return out({ ok: true, question: q.question, token: questionToken(q.answer, ip) });
	}

	if (act === "check") {
		const token = String(fd.get("token") || "");
		const answer = String(fd.get("answer") || "").trim();
		if (!token) return out({ ok: false, msg: "문제를 다시 불러와 주세요." });
		if (answer === "" || answer.length > 50) return out({ ok: false, msg: "정답을 입력해 주세요." });
		const response = await checkAnswer(token, answer, ip);
		if (!response) return out({ ok: false, msg: "정답이 아닙니다. 새 문제를 풀어 주세요." });
		return out({ ok: true, response });
	}

	return out({ ok: false, msg: "올바르지 않은 요청입니다." });
}
