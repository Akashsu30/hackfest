const TooltipWord = ({ word, meaning }) => (
  <span className="tooltip-word">
    {word}
    <span className="tooltip-box">{meaning}</span>
  </span>
);

export default TooltipWord;
