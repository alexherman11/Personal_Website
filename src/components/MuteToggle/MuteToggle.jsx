import './MuteToggle.css'

export default function MuteToggle({ muted, onToggle }) {
  return (
    <button
      className="mute-toggle"
      onClick={onToggle}
      title={muted ? 'Unmute audio' : 'Mute audio'}
    >
      {muted ? '[x]' : '[~]'}
    </button>
  )
}
