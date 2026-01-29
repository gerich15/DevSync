export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
