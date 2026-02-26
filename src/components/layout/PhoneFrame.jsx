export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] h-[calc(100vh-2rem)] max-h-[932px] bg-light rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-center py-2 border-b border-secondary/50">
          <img src="/logo.png" alt="Drums Only" className="h-14 w-14 rounded" />
        </div>
        {children}
      </div>
    </div>
  )
}
