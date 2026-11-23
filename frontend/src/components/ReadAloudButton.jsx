import { useCallback, useEffect, useRef, useState } from 'react';

const buttonStyle = (speaking) => ({
  width: 38,
  height: 38,
  borderRadius: 10,
  flexShrink: 0,
  background: speaking ? '#e7f9ed' : '#f1f7f8',
  border: `1.5px solid ${speaking ? '#48b97c' : '#d4e4e8'}`,
  color: speaking ? '#238650' : '#506b80',
  display: 'grid',
  placeItems: 'center',
  fontSize: 18,
  cursor: 'pointer',
  transition: 'all .2s',
});

const authorizedExplanation = (feedback) => (
  feedback?.finished && feedback?.is_correct && feedback.explanation
    ? `Explanation: ${feedback.explanation}`
    : ''
);

export function quizReadAloudText(item, feedback) {
  const options = (item.options || []).map((option, index) => (
    `Option ${'ABCDE'[index] || index + 1}: ${option.text}.`
  ));
  return [
    item.scenario && `Situation: ${item.scenario}.`,
    item.prompt,
    'Choose one answer.',
    ...options,
    authorizedExplanation(feedback),
  ].filter(Boolean).join(' ');
}

export function matchingReadAloudText(item, feedback) {
  const leftItems = (item.lefts || []).map((entry) => entry.text).join('. ');
  const rightItems = (item.rights || []).map((entry) => entry.text).join('. ');
  return [
    item.prompt,
    'Pick an item on the left, then pick its match on the right.',
    leftItems && `Items: ${leftItems}.`,
    rightItems && `Descriptions: ${rightItems}.`,
    authorizedExplanation(feedback),
  ].filter(Boolean).join(' ');
}

export function sequencingReadAloudText(item, steps, feedback) {
  const stepText = (steps || []).map((step) => step.content || step.text).filter(Boolean).join('. ');
  return [
    item.prompt,
    'Place every card in the order that makes the most sense.',
    stepText && `Cards in their current displayed order: ${stepText}.`,
    authorizedExplanation(feedback),
  ].filter(Boolean).join(' ');
}

export default function ReadAloudButton({ text, label = 'Read question aloud' }) {
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => (
    typeof window !== 'undefined'
    && !!window.speechSynthesis
    && typeof window.SpeechSynthesisUtterance === 'function'
  ));

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  useEffect(() => {
    synthRef.current = supported ? window.speechSynthesis : null;
    return stop;
  }, [supported, stop]);

  useEffect(() => {
    stop();
  }, [text, stop]);

  const toggle = useCallback(() => {
    if (!synthRef.current || !text) return;
    if (speaking) {
      stop();
      return;
    }

    synthRef.current.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    utterance.lang = 'en-US';
    const voices = typeof synthRef.current.getVoices === 'function' ? synthRef.current.getVoices() : [];
    const preferredVoice = voices.find((voice) => /google|samantha|karen/i.test(voice.name) && voice.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setSpeaking(false);
      }
    };
    utteranceRef.current = utterance;
    setSpeaking(true);
    synthRef.current.speak(utterance);
  }, [speaking, stop, text]);

  if (!supported) {
    return <button type="button" disabled aria-label="Read aloud unavailable in this browser" title="Read aloud is unavailable in this browser" style={{ ...buttonStyle(false), cursor: 'not-allowed', opacity: 0.6 }}>🔊</button>;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={speaking ? 'Stop reading' : label}
      aria-label={speaking ? 'Stop reading' : label}
      aria-pressed={speaking}
      style={buttonStyle(speaking)}
    >
      {speaking ? '⏹' : '🔊'}
    </button>
  );
}
