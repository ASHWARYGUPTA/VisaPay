import { Suspense } from "react";
import DashboardComponent from "../../../components/pages/Dashboard/DashboardComponent";

function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C8CFF3] to-[#1434CB]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white font-semibold">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardComponent />
    </Suspense>
  );
}
