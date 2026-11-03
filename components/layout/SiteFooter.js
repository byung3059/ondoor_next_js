import LogoTxt from "./LogoTxt";
import PopupLink from "@/components/popup/PopupLink";
import { CF_TITLE, od } from "@/lib/site";

// 푸터 (원본: tail.php) — 개인정보처리방침 · 이용약관은 팝업
export default function SiteFooter() {
	return (
		<footer id="ft">
			<div className="ft_inner">
				<div className="ft_info">
					<p className="ft_logo" role="img" aria-label={CF_TITLE}>
						<LogoTxt />
					</p>
					<p className="ft_links">
						<PopupLink name="privacy">개인정보처리방침</PopupLink>
						<PopupLink name="terms">이용약관</PopupLink>
					</p>
					<ul className="ft_biz">
						<li>대표 : {od.ceo}</li>
						<li>대표번호 : {od.telDisplay}</li>
						<li>사업자등록번호 : {od.bizNo}</li>
					</ul>
					<span className="ft_copy">
						COPYRIGHT &copy; {new Date().getFullYear()} {CF_TITLE}. All rights reserved.
					</span>
				</div>
			</div>
		</footer>
	);
}
