"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

// 관리자 로그인 — 비밀번호 하나 (Vercel 환경 변수 ADMIN_PASSWORD)
export default function LoginForm({ next, devHint, disabled }) {
	const [state, action, pending] = useActionState(login, null);
	return (
		<form action={action}>
			<h1>ondoor 관리자</h1>
			<p>상담 문의를 확인하려면 로그인해 주세요.</p>
			<input type="hidden" name="next" value={next} />
			<div className="adm_field">
				<label htmlFor="adm_pw">비밀번호</label>
				<input id="adm_pw" className="adm_input" type="password" name="password" autoComplete="current-password" required autoFocus disabled={disabled} />
			</div>
			<button type="submit" className="adm_btn is-primary" disabled={pending || disabled}>
				{pending ? "확인 중…" : "로그인"}
			</button>
			{(state?.error || disabled) && (
				<p className="adm_err" role="alert">
					{state?.error || "관리자 비밀번호(ADMIN_PASSWORD)가 설정되지 않았습니다. Vercel 환경 변수에 넣어 주세요."}
				</p>
			)}
			{devHint && <p className="adm_hint">로컬 개발용 기본 비밀번호: {devHint}</p>}
		</form>
	);
}
