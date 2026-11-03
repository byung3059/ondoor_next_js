"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

/* 자동등록방지 (t2CAPTCHA 문제 풀기, .t2cap) — 문제 받기 · 정답 확인은 /api/captcha
   문제를 풀고 [확인](또는 Enter) → 통과하면 숨김 칸(t2-captcha-response)에 통과 표시가 들어가고, 상담 저장 때 서버가 확인
   ref.ensure(): 정답을 적어 두고 [확인] 없이 바로 보내도 먼저 확인 / ref.reload(): 새 문제 */
export default function Captcha({ pre, ref }) {
	const [q, setQ] = useState("문제를 불러오는 중입니다…");
	const [ok, setOk] = useState(false);
	// 숨김 칸(문제 토큰 · 통과 표시)은 바로 DOM에 씀 — 확인 직후 폼을 보낼 때 React가 다시 그리기 전에도 값이 들어 있게
	const tokRef = useRef(null),
		resRef = useRef(null);
	const setHidden = (token, response) => {
		if (tokRef.current) tokRef.current.value = token;
		if (resRef.current) resRef.current.value = response;
	};
	const [checking, setChecking] = useState(false);
	const [busy, setBusy] = useState(true); // 정답 칸 · 확인 버튼 잠금
	const [msg, setMsg] = useState(["", ""]);
	const inRef = useRef(null);
	const st = useRef({ ok: false, token: "" }); // 최신 값 (비동기 확인 중에 읽음)
	const reTimer = useRef(0);

	const call = async (data) => {
		const fd = new FormData();
		for (const k in data) fd.append(k, data[k]);
		const res = await fetch("/api/captcha", { method: "POST", body: fd, credentials: "same-origin", headers: { "X-Requested-With": "XMLHttpRequest" } });
		return res.json();
	};

	// 새 문제
	const load = useCallback(async () => {
		const mine = (st.current = { ok: false, token: "" });
		setOk(false);
		setHidden("", "");
		if (inRef.current) inRef.current.value = "";
		setBusy(true);
		setQ("문제를 불러오는 중입니다…");
		setMsg(["", ""]);
		try {
			const d = await call({ act: "new" });
			if (st.current !== mine) return; // 그사이 새 문제를 또 받았으면 이 응답은 버림
			if (!d.ok) throw new Error(d.msg);
			setQ(d.question);
			mine.token = d.token;
			setHidden(d.token, "");
			setBusy(false);
		} catch (err) {
			if (st.current !== mine) return;
			setQ("문제를 불러오지 못했습니다.");
			setMsg([(err && err.message) || "오른쪽 위 새로고침을 눌러 주세요.", "err"]);
		}
	}, []);

	// 정답 확인 → 통과하면 true
	const check = useCallback(async () => {
		if (st.current.ok) return true;
		const answer = (inRef.current?.value || "").trim();
		if (!answer) {
			setMsg(["정답을 입력해 주세요.", "err"]);
			inRef.current?.focus();
			return false;
		}
		// 확인 중: 안내 글 없이 버튼만 잠금 (.is-checking, 모양은 그대로)
		setBusy(true);
		setChecking(true);
		setMsg(["", ""]);
		try {
			const d = await call({ act: "check", token: st.current.token, answer });
			setChecking(false);
			if (d.ok) {
				st.current.ok = true;
				setOk(true);
				setHidden(st.current.token, d.response);
				setMsg(["확인되었습니다.", "ok"]);
				return true;
			}
			setMsg([d.msg || "정답이 아닙니다. 새 문제를 풀어 주세요.", "err"]);
			reTimer.current = setTimeout(load, 1200); // 틀리면 잠시 뒤 새 문제
		} catch (err) {
			setChecking(false);
			setMsg(["확인하지 못했습니다. 다시 시도해 주세요.", "err"]);
			setBusy(false);
		}
		return false;
	}, [load]);

	useImperativeHandle(ref, () => ({ ensure: check, reload: load, isOk: () => st.current.ok }), [check, load]);

	useEffect(() => {
		load();
		return () => clearTimeout(reTimer.current);
	}, [load]);

	const cls = ["cf_field t2cap", ok && "is-ok", checking && "is-checking"].filter(Boolean).join(" ");
	return (
		<div className={cls}>
			<div className="t2cap_head">
				<label htmlFor={`${pre}cap`}>자동등록방지</label>
				<button type="button" className="t2cap_refresh" aria-label="새 문제 받기" onClick={load}>
					새로고침
				</button>
			</div>
			<div className="t2cap_row">
				<p className="t2cap_q" aria-live="polite">
					{q}
				</p>
				<input
					type="text"
					id={`${pre}cap`}
					className="t2cap_answer"
					autoComplete="off"
					maxLength={20}
					placeholder="정답 입력"
					ref={inRef}
					disabled={busy || ok}
					onKeyDown={(e) => {
						if (e.key !== "Enter") return;
						e.preventDefault(); // 폼 전체가 보내지지 않게, 정답 확인만
						check();
					}}
				/>
				<button type="button" className="t2cap_check" disabled={busy} onClick={check}>
					{ok ? "완료" : "확인"}
				</button>
			</div>
			<p className={"t2cap_msg" + (msg[1] ? " is-" + msg[1] : "")} role="status" aria-live="polite">
				{msg[0]}
			</p>
			{/* value · defaultValue를 주지 않음: hidden 칸은 둘이 같은 값이라, 주면 다시 그릴 때마다 React가 통과 표시를 ""로 되돌림 */}
			<input type="hidden" name="t2-captcha-token" ref={tokRef} />
			<input type="hidden" name="t2-captcha-response" ref={resRef} />
		</div>
	);
}
