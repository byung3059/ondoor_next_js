import { connection } from "next/server";
import ContactFormClient from "./ContactFormClient";
import { createFormToken } from "@/lib/contact";

/* 상담 문의 폼 — 서버에서 스팸 방지 토큰(폼을 보여 준 시각 + 서명)을 만들어 넘김
   <ContactForm pre="cf_" />        → 메인 하단 · 상담문의 페이지 (전체 항목)
   <ContactForm pre="cw_" quick />  → 오른쪽 아래 빠른 상담
   칸 id 앞글자(pre)가 달라 한 화면에 둘 다 있어도 겹치지 않음 */
export default async function ContactForm({ pre = "cf_", quick = false }) {
	await connection(); // 요청마다 새 토큰 (정적 페이지로 굳지 않게)
	return <ContactFormClient token={createFormToken()} pre={pre.replace(/[^a-z0-9_]/gi, "")} quick={quick} />;
}
