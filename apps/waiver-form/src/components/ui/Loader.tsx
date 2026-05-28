export default function Loader({ message = 'Submitting...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
