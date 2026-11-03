// Material Symbols 아이콘 (관리자 화면) — 이름: https://fonts.google.com/icons
export default function Icon({ name, className = "" }) {
	return (
		<span className={`material-symbols-rounded ${className}`.trim()} aria-hidden="true">
			{name}
		</span>
	);
}
