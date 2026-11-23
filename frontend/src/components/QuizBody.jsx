import { useEffect, useState } from 'react';

export default function QuizBody({ item, result, locked, onAnswer }) {
  const [sel, setSel] = useState(null);
  const [wrong, setWrong] = useState([]);

  useEffect(() => {
    if (!result || result.is_correct) return;
    setWrong((w) => [...w, sel]);
    if (!result.finished) setSel(null);
  }, [result]); // eslint-disable-line

  const choose = (id) => { setSel(id); onAnswer({ option_id: id }); };

  return (
    <fieldset className="quiz" disabled={locked}>
      {item.scenario && <p className="scenario"><strong>Situation:</strong> {item.scenario}</p>}
      <legend className="question">{item.prompt}</legend>
      <p className="hint-text">Choose one answer.</p>
      {item.options.map((o, n) => {
        const isCorrect = result?.finished && result.correct_answer === o.id;
        const isWrong = wrong.includes(o.id);
        return (
          <label key={o.id} className={`option ${sel === o.id ? 'picked' : ''} ${isCorrect ? 'right' : ''} ${isWrong ? 'wrong' : ''}`}>
            <input type="radio" name={`q-${item.id}`} value={o.id} checked={sel === o.id} disabled={locked || isWrong} onChange={() => choose(o.id)} />
            <span className="letter" aria-hidden="true">{'ABCDE'[n]}</span>
            <span className="text">{o.text}</span>
            {isCorrect && <span className="mark">✓ Correct answer</span>}
            {isWrong && <span className="mark">✗ Not this one</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
