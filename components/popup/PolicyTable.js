// 정책 팝업 안 2열 표 — rows: [[머리, 내용], ...]
export default function PolicyTable({ caption, rows }) {
	return (
		<table className="policy_tbl">
			<caption className="blind">{caption}</caption>
			<tbody>
				{rows.map(([th, td]) => (
					<tr key={th}>
						<th scope="row">{th}</th>
						<td>{td}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
