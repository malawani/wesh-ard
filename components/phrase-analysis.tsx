import type { PhraseAnalysis as Analysis } from "../content/schemas";
export function PhraseAnalysis({ analysis, historical = false }: { analysis?: Analysis; historical?: boolean }) {
  return <details className="phrase-analysis">
    <summary>المعنى والأثر</summary>
    {analysis ? <dl>
      <dt>المعنى المباشر</dt><dd>{analysis.directMeaning}</dd>
      <dt>المعنى الضمني المحتمل</dt><dd>{analysis.possibleImplicitMeaning}</dd>
      <dt>الأثر النفسي المحتمل</dt><dd>{analysis.possiblePsychologicalImpact}</dd>
      <dt>حدود التفسير</dt><dd>{analysis.interpretationLimits}</dd>
    </dl> : <p>{historical ? "لا يتوفر شرح لهذه النسخة المحفوظة من العبارة. احتفظنا بنصها كما حفظته." : "لم يُضف شرح لهذه العبارة بعد."}</p>}
  </details>;
}
