/* We Are 데모 재생 제어 — 데모 애니메이션은 GIF처럼 계속 반복
   재생 조건: 상자가 화면에 보이고(inView) + 설명 칸이 나타난 뒤(shown) — 칸이 나타나는 순간 처음부터 재생
   (상자가 화면에 걸리기만 해도 재생하면, 칸이 실제로 보일 때쯤 데모가 이미 중간까지 돌아가 아무 장면에서 튀어나옴)
   데모 컴포넌트가 setTimeline, 상자(DemoBox)가 setInView, We Are 섹션이 start · stop을 부름 */
export function createDemoControl() {
	return {
		tl: null,
		inView: false,
		shown: false,
		setTimeline(tl) {
			this.tl = tl;
			if (!tl) return;
			if (this.shown && this.inView) tl.play();
			else tl.pause();
		},
		setInView(v) {
			this.inView = v;
			if (!this.tl) return;
			if (v && this.shown) this.tl.play();
			else this.tl.pause();
		},
		// 설명 칸이 나타날 때: 처음부터 (다시 나타날 때마다)
		start() {
			if (this.shown) return;
			this.shown = true;
			if (!this.tl) return;
			this.tl.restart();
			if (!this.inView) this.tl.pause();
		},
		// 설명 칸이 다시 숨을 때: 멈춤 (다음에 나타나면 처음부터)
		stop() {
			if (!this.shown) return;
			this.shown = false;
			if (this.tl) this.tl.pause();
		},
	};
}
