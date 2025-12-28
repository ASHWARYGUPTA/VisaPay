import { Suspense } from "react";
import SignInComponent from "../../../components/pages/Signin/SignInComponent";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C8CFF3] to-[#1434CB]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white font-semibold">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInComponent />
    </Suspense>
  );
}
