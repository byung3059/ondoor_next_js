// 정리 목록: 이벤트 · 옵저버 · 타이머 등을 등록해 두고 컴포넌트가 사라질 때 한 번에 해제
export function createScope() {
	const offs = [];
	const scope = {
		on(target, type, fn, opts) {
			target.addEventListener(type, fn, opts);
			offs.push(() => target.removeEventListener(type, fn, opts));
			return fn;
		},
		add(fn) {
			offs.push(fn);
			return fn;
		},
		observe(observer, ...els) {
			els.forEach((el) => el && observer.observe(el));
			offs.push(() => observer.disconnect());
			return observer;
		},
		timeout(fn, ms) {
			const id = setTimeout(fn, ms);
			offs.push(() => clearTimeout(id));
			return id;
		},
		dispose() {
			while (offs.length) {
				try {
					offs.pop()();
				} catch (e) {}
			}
		},
	};
	return scope;
}
