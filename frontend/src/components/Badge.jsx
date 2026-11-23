export default function Badge({ status }) {
  let className = 'badge';
  let text = status;

  if (status === 'Mastered') {
    className += ' green-bg';
  } else if (status === 'Practising') {
    className += ' yellow-bg';
  } else if (status === 'Try Again') {
    className += ' red-bg';
  } else if (status === 'Locked') {
    text = '🔒 Locked';
  }

  return <span className={className}>{text}</span>;
}
