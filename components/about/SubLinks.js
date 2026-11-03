import Link from "next/link";
import RollText from "@/components/layout/RollText";

function SubLink({ href, external, kind, title, desc }) {
	const inner = (
		<>
			<span className="t">
				{/* 마우스를 올리면 한 글자씩 위로 굴러 올라감 (CSS .sub_link b span) */}
				<RollText as="b" className="" child="span" text={title} />
				<small>{desc}</small>
			</span>
			<span className="arw" aria-hidden="true"></span>
		</>
	);
	const cls = `sub_link ${kind}`;
	return external ? (
		<a href={href} className={cls} data-rise="">
			{inner}
		</a>
	) : (
		<Link href={href} className={cls} data-rise="">
			{inner}
		</Link>
	);
}

// ⑤ Blog · Contact — 메뉴 카드(.gnb_link)와 같은 모양 · 순서, 색만 다름 (BLOG 회색 · CONTACT 검정)
export default function SubLinks({ blogUrl }) {
	return (
		<div className="sub_links">
			<SubLink href={blogUrl} external kind="is-blog" title="Blog" desc="인사이트 · 칼럼" />
			<SubLink href="/page/contact" kind="is-contact" title="Contact" desc="프로젝트 상담 문의" />
		</div>
	);
}
