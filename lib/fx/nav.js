// 메인 페이지 안 위치 이동 (헤더 메뉴 · /#weare 같은 주소로 들어왔을 때)
import { glass } from "./bridge";
import { scrollToY } from "./smooth-scroll";
import { ScrollTrigger } from "./gsap";

export const SECTION_KEYS = ["ondoor", "what", "weare", "contact"];

const topOf = (sel) => {
	const el = document.querySelector(sel);
	return el ? el.getBoundingClientRect().top + window.scrollY : 0;
};

export function posOf(key) {
	if (key === "what") {
		// 서비스 카드가 올라오는 지점 (유리 도형이 알려 주는 화면 수, 없으면 섹션 위)
		const s = glass.sec;
		return s && s.secOutAt ? s.unit() * s.secOutAt + 2 : topOf(".service");
	}
	// WE ARE 제목이 다 떠 있는 지점: PC는 고정 시작 뒤 0.3화면 (0.75화면부터 흐려짐), 모바일은 고정 없이 제목 화면 맨 위
	if (key === "weare") return topOf(".weare_intro") + (innerWidth > 768 ? innerHeight * 0.3 : 2);
	if (key === "contact") return topOf(".weare_contact");
	return 0; // ondoor: 맨 위
}

// 누른 위치로 바로 이동 (스크롤 애니메이션을 다 거쳐 가지 않아 버벅임 없음) + 스크롤 애니메이션 상태 즉시 갱신
export function goTo(key) {
	scrollToY(posOf(key));
	ScrollTrigger.update();
}
