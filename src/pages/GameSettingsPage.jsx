import { Card } from '../components/Card'

export function GameSettingsPage() {
  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-7"
        style={{ textShadow: '0 0 12px rgba(244,196,48,0.3)' }}
      >
        GAME SETTINGS
      </h1>
      <Card className="text-center py-12">
        <p className="text-text-muted">
          Coming soon. Dungeon configuration and other game settings will be manageable here.
        </p>
      </Card>
    </>
  )
}
