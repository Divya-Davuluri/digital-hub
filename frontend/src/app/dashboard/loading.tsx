export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"/>
        <p className="text-slate-500 font-bold text-sm">
          Loading Digital Marketing Hub...
        </p>
      </div>
    </div>
  );
}
