// 부드러운 스크롤(Lenis) — 페이지 컴포넌트(SmoothScroll)가 켜고 끔, 팝업 · 메뉴 · 인트로 잠금이 getLenis()로 씀
let lenis = null;
export const getLenis = () => lenis;
export const setLenis = (l) => (lenis = l);

// 지정 위치로 스크롤 (Lenis가 있으면 Lenis로)
export function scrollToY(y, { immediate = true, duration } = {}) {
	if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration });
	else window.scrollTo(immediate ? { top: y } : { top: y, behavior: "smooth" });
}
