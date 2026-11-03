"use client";

import { useRef, useState } from "react";
import CfSelect from "./CfSelect";
import Captcha from "./Captcha";
import PopupLink from "@/components/popup/PopupLink";
import { usePopup } from "@/components/popup/PopupProvider";
import { contactBudgets, contactJobs } from "@/lib/contact-options";

/* 상담 문의 폼 (원본: include/contact_form.php + js/contact_form.js) — 모양은 scss/_contact_form.scss
   - 직종 · 예산: 커스텀 셀렉트, "직접 입력"을 고르면 아래 칸이 열리고 필수
   - 체크박스: 바꾼 순간에만 .is-toggled → 체크 애니메이션
   - 전송: 페이지 이동 없이 fetch, 성공하면 칸 비우고 접수 완료 팝업 + "cf:done" 이벤트 (오른쪽 아래 문의칸이면 닫힘)
   quick: 오른쪽 아래 빠른 상담 — 이름 · 연락처 · 문의내용 + 동의만 (직종 · 예산 · 자동등록방지 없음) */
export default function ContactFormClient({ token, pre = "cf_", quick = false }) {
	const { open } = usePopup();
	const [job, setJob] = useState("");
	const [budget, setBudget] = useState("");
	const [msg, setMsg] = useState(["", ""]);
	const [sending, setSending] = useState(false);
	const capRef = useRef(null);
	const btnRef = useRef(null);

	const say = (text, type = "") => setMsg([text, type]);

	const onSubmit = async (e) => {
		e.preventDefault();
		const form = e.currentTarget;
		if (!form.reportValidity()) return;
		if (capRef.current && !(await capRef.current.ensure())) return say("자동등록방지 문제를 풀어 주세요.", "err");
		setSending(true);
		say("보내는 중입니다…");
		try {
			const fd = new FormData(form);
			fd.append("ajax", "1");
			const res = await fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
			const data = await res.json();
			say(data.msg, data.ok ? "ok" : "err");
			if (data.ok) {
				form.reset();
				setJob("");
				setBudget("");
				form.dispatchEvent(new CustomEvent("cf:done", { bubbles: true })); // 오른쪽 아래 문의칸이면 닫힘
				open("contact_done", btnRef.current); // 접수 완료 팝업
			}
			// 통과 표시는 한 번만 쓰여서, 접수됐거나 서버가 자동등록방지를 거절하면 새 문제
			if (data.ok || data.code === "captcha") capRef.current?.reload();
		} catch (err) {
			say("전송하지 못했습니다. 잠시 후 다시 시도해 주세요.", "err");
		}
		setSending(false);
	};

	// 체크박스: 바꾼 순간에만 .is-toggled (연달아 눌러도 애니메이션이 다시 시작되게)
	const onToggle = (e) => {
		const t = e.currentTarget;
		t.classList.remove("is-toggled");
		void t.offsetWidth;
		t.classList.add("is-toggled");
	};

	return (
		<form className="contact_form" action="/api/contact" method="post" onSubmit={onSubmit}>
			<input type="hidden" name="token" defaultValue={token} />
			{quick && <input type="hidden" name="quick" defaultValue="1" />}

			{/* 사람에겐 안 보이는 칸 (자동 등록 프로그램이 채우면 저장하지 않음) */}
			<div className="cf_hp" aria-hidden="true">
				<label>
					홈페이지 <input type="text" name="hp_url" defaultValue="" tabIndex={-1} autoComplete="off" />
				</label>
			</div>

			<div className="cf_grid">
				<div className="cf_field">
					<label htmlFor={`${pre}name`}>이름</label>
					<input type="text" id={`${pre}name`} name="wr_name" required maxLength={20} autoComplete="name" placeholder="이름을 입력해 주세요" />
				</div>
				<div className="cf_field">
					<label htmlFor={`${pre}tel`}>연락처</label>
					<input type="tel" id={`${pre}tel`} name="wr_1" required maxLength={20} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" />
				</div>
				{!quick && (
					<>
						<SelectField id={`${pre}job`} label="직종" name="wr_2" etcName="wr_2_etc" options={contactJobs} value={job} onChange={setJob} />
						<SelectField id={`${pre}budget`} label="예산" name="wr_3" etcName="wr_3_etc" options={contactBudgets} value={budget} onChange={setBudget} />
					</>
				)}
				<div className="cf_field is-full">
					<label htmlFor={`${pre}content`}>문의내용</label>
					<textarea
						id={`${pre}content`}
						name="wr_content"
						required
						maxLength={2000}
						rows={5}
						data-lenis-prevent=""
						placeholder="제작하려는 사이트, 원하는 일정, 참고 사이트 등을 자유롭게 적어 주세요."
					/>
				</div>
			</div>

			{!quick && <Captcha pre={pre} ref={capRef} />}

			<div className="cf_agree">
				<input
					type="checkbox"
					id={`${pre}agree`}
					name="agree"
					value="1"
					required
					onChange={onToggle}
					onAnimationEnd={(e) => e.animationName === "cf-check-pop" && e.currentTarget.classList.remove("is-toggled")}
				/>
				<label htmlFor={`${pre}agree`}>
					<b>개인정보처리방침</b>에 동의합니다.
				</label>
				<PopupLink name="privacy">보기</PopupLink>
			</div>

			<div className="cf_submit">
				<button type="submit" className="cf_btn" disabled={sending} ref={btnRef}>
					상담 신청하기
				</button>
				<p className={"cf_msg" + (msg[1] ? " is-" + msg[1] : "")} role="status" aria-live="polite">
					{msg[0]}
				</p>
			</div>
		</form>
	);
}

// 직종 · 예산 칸: 커스텀 셀렉트 + "직접 입력" 칸 (고르면 열리고 필수, 다른 걸 고르면 닫힘)
function SelectField({ id, label, name, etcName, options, value, onChange }) {
	const etcRef = useRef(null);
	const on = value === "__etc";
	return (
		<div className={on ? "cf_field is-etc" : "cf_field"}>
			<label htmlFor={`${id}_btn`}>{label}</label>
			<CfSelect
				id={id}
				name={name}
				required
				options={options}
				value={value}
				onChange={(v) => {
					onChange(v);
					if (v === "__etc") requestAnimationFrame(() => etcRef.current?.focus());
				}}
			/>
			<input type="text" className="cf_etc" name={etcName} maxLength={30} placeholder={`${label}을 입력해 주세요`} aria-label={`${label} 직접 입력`} disabled={!on} required={on} ref={etcRef} />
		</div>
	);
}
