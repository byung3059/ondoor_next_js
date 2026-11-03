// 헤더 맨 위 배경색 띠(.hd_edge) 숨김 상태 — 회사소개 페이지 스크롤 연출(SubFx)이 바꾸고 헤더가 읽음
import { useSyncExternalStore } from "react";

let edgeOff = false;
const subs = new Set();

export function setEdgeOff(v) {
	if (edgeOff === v) return;
	edgeOff = v;
	subs.forEach((fn) => fn());
}

const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
export const useEdgeOff = () =>
	useSyncExternalStore(
		subscribe,
		() => edgeOff,
		() => false,
	);
