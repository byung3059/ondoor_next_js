"use client";

import { removeContact } from "@/app/admin/actions";

// 삭제 — 한 번 더 묻고 지움 (되돌릴 수 없음)
export default function DeleteButton({ id, name }) {
	return (
		<form
			action={removeContact}
			onSubmit={(e) => {
				if (!confirm(`${name} 님의 문의를 삭제할까요? 되돌릴 수 없습니다.`)) e.preventDefault();
			}}
		>
			<input type="hidden" name="id" value={id} />
			<button type="submit" className="adm_btn is-sm is-danger">
				삭제
			</button>
		</form>
	);
}
