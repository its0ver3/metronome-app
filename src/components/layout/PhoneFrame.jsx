export default function PhoneFrame({ children }) {
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] h-[calc(100vh-2rem)] max-h-[932px] brick-texture rounded-2xl border border-[#3A3A3A] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-2 border-b border-secondary/50">
          <img src={logoSrc} alt="Drums Only" className="h-28 rounded" />
          <p className="text-xs text-white/60 tracking-wide" style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}>by drummers for drummers</p>
        </div>
        {children}
      </div>
    </div>
  )
}
