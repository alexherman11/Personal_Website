import MuteToggle from '../MuteToggle/MuteToggle'
import './CRTScreen.css'

export default function CRTScreen({
  children, muted, onToggleMute, showMute = true,
  musicVolume, onMusicVolumeChange,
  keystrokeVolume, onKeystrokeVolumeChange,
}) {
  return (
    <div className="crt-screen">
      <div className="crt-content">
        {children}
      </div>
      {showMute && (
        <MuteToggle
          muted={muted}
          onToggle={onToggleMute}
          musicVolume={musicVolume}
          onMusicVolumeChange={onMusicVolumeChange}
          keystrokeVolume={keystrokeVolume}
          onKeystrokeVolumeChange={onKeystrokeVolumeChange}
        />
      )}
      <div className="crt-scanlines" />
      <div className="crt-flicker" />
    </div>
  )
}
