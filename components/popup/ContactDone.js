"use client";

import PolicyPopup from "./PolicyPopup";

// 상담 신청 완료 팝업 (원본: include/contact_done.php) — 폼 접수에 성공하면 ContactForm이 띄움
export default function ContactDone(props) {
	return (
		<PolicyPopup id="pop_contact_done" variant="is-done" head={false} {...props}>
			<div className="done_body">
				<span className="done_icon" aria-hidden="true"></span>
				<h2 id="pop_contact_done_tit">상담 신청이 완료되었습니다</h2>
				<p>
					남겨 주신 내용을 확인한 뒤
					<br />
					입력하신 연락처로 연락드리겠습니다.
				</p>
			</div>
		</PolicyPopup>
	);
}
