/** @type {import('next').NextConfig} */
const nextConfig = {
	// 원본(그누보드)은 /page/ondoor/ 처럼 끝 슬래시로 오면 짧은 주소로 301 — Next 기본 동작과 같음
	trailingSlash: false,
	// 로컬 개발용 내장 Postgres(WASM)는 묶지 않고 node_modules에서 그대로 불러옴
	serverExternalPackages: ["@electric-sql/pglite"],
	// 원본 .htaccess의 보안 헤더
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},
};

export default nextConfig;
