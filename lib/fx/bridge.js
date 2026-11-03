// 메인 유리 도형(glass.js) ↔ 서비스 섹션 · 헤더 메뉴 사이 연결 (원본의 window.GLASS_SEC · "glass:secout" 이벤트)
export const glass = {
	sec: null, // { secOutAt, syncsService, out, unit(), show(el, o), move(el, o) } — 메인 유리 도형이 있을 때만
};

const bus = typeof window !== "undefined" ? new EventTarget() : null;

// What We Do 제목이 카드 줄 위 자리로 이동했는지(true) / 가운데로 돌아왔는지(false)
export const emitSecOut = (o) => bus && bus.dispatchEvent(new CustomEvent("secout", { detail: o }));
export function onSecOut(fn) {
	const h = (e) => fn(e.detail);
	bus.addEventListener("secout", h);
	return () => bus.removeEventListener("secout", h);
}
