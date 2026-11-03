import "@/styles/admin/admin.scss";

export const metadata = {
	title: { template: "%s | ondoor 관리자", default: "ondoor 관리자" },
	robots: { index: false, follow: false },
};

// 화면 모드(light · dark)를 그리기 전에 정함 — 관리자가 바꾼 모드는 브라우저(localStorage)에 저장 (원본 adm_theme.php와 같음)
const MODE_SCRIPT = `(function(d){var m="";try{m=localStorage.getItem("adm_theme_mode")||""}catch(e){}if(m!=="light"&&m!=="dark")m="light";d.setAttribute("data-theme",m);d.classList.add("adm-theme")})(document.documentElement);`;

/* 관리자 화면 틀 — 사이트 헤더 · 애니메이션 없이 따로 (사이트는 app/(site)/layout.js)
   모양은 그누보드 관리자 테마(styles/admin, 원본 extend/adm_theme) */
export default function AdminLayout({ children }) {
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" precedence="default" />
			<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,300..700,0..1,0&display=block" precedence="default" />
			{children}
		</>
	);
}
