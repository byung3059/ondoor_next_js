"use client";

/* 팝업 틀 (.policy_pop) — 어두운 배경 · 상자 · 머리(제목 + 닫기) · 본문 · 아래 버튼
   variant: 상자 모양 (is-done: 상담 신청 완료) / head가 false면 머리 없이 본문만 */
export default function PolicyPopup({ id, title, variant, open, onClose, head = true, footLabel = "확인", children }) {
	const titId = `${id}_tit`;
	return (
		<div className={["policy_pop", variant, open && "is-open"].filter(Boolean).join(" ")} id={id} role="dialog" aria-modal="true" aria-labelledby={titId}>
			<div className="policy_dim" data-pop-close="" onClick={onClose}></div>
			<div className="policy_box">
				{head ? (
					<>
						<div className="policy_head">
							<h2 id={titId}>{title}</h2>
							<button type="button" className="policy_close" data-pop-close="" aria-label="닫기" onClick={onClose}></button>
						</div>
						<div className="policy_body" data-lenis-prevent="">
							{children}
						</div>
					</>
				) : (
					children
				)}
				<div className="policy_foot">
					<button type="button" className="policy_btn" data-pop-close="" onClick={onClose}>
						{footLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
