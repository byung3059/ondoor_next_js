// 자동등록방지 토큰 (원본 t2CAPTCHA는 PHP 세션에 정답을 저장 — 여기선 정답을 서명에 넣어 서버가 기억하지 않음)
// 문제 토큰:  만료시각.난수.서명(정답 · IP 포함) → 정답을 맞혀야 같은 서명이 나옴, 문제마다 한 번만 확인 가능
// 통과 표시:  t2_success_만료시각.난수.서명(IP 포함) → 상담 저장 때 한 번만 쓰임
import "server-only";
import crypto from "node:crypto";
import { sign, signOk } from "./contact";
import { sql } from "./db";

const QUESTION_TTL = 5 * 60 * 1000;
const SUCCESS_TTL = 10 * 60 * 1000;
const nonce = () => crypto.randomBytes(12).toString("hex");
const norm = (a) => String(a).trim().toLowerCase();

// 한 번만 쓰기: 처음이면 true (이미 쓴 것이면 false) — 하루 지난 기록은 지움
export async function useOnce(key) {
	const rows = await sql`insert into used_tokens (token) values (${key}) on conflict do nothing returning token`;
	if (Math.random() < 0.05) await sql`delete from used_tokens where used_at < now() - interval '1 day'`;
	return rows.length > 0;
}

export function questionToken(answer, ip) {
	const exp = Date.now() + QUESTION_TTL,
		n = nonce();
	return `${exp}.${n}.${sign(`q|${exp}|${n}|${ip}|${norm(answer)}`, 64)}`;
}

// 정답이 맞으면 통과 표시, 아니면 null (맞든 틀리든 그 문제는 다시 확인할 수 없음)
export async function checkAnswer(token, answer, ip) {
	const m = /^(\d{13})\.([a-f0-9]{24})\.([a-f0-9]{64})$/.exec(String(token));
	if (!m || Number(m[1]) < Date.now()) return null;
	if (!(await useOnce(`q:${m[2]}`))) return null;
	if (!signOk(`q|${m[1]}|${m[2]}|${ip}|${norm(answer)}`, m[3], 64)) return null;
	const exp = Date.now() + SUCCESS_TTL,
		n = nonce();
	return `t2_success_${exp}.${n}.${sign(`ok|${exp}|${n}|${ip}`, 64)}`;
}

// 상담 저장 때: 통과 표시가 진짜이고 아직 안 쓴 것인지 (쓰면 사라짐)
export async function useSuccessToken(res, ip) {
	const m = /^t2_success_(\d{13})\.([a-f0-9]{24})\.([a-f0-9]{64})$/.exec(String(res));
	if (!m || Number(m[1]) < Date.now()) return false;
	if (!signOk(`ok|${m[1]}|${m[2]}|${ip}`, m[3], 64)) return false;
	return useOnce(`ok:${m[2]}`);
}
