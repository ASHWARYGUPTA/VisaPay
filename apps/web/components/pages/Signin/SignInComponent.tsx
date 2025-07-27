import VisaLogo from "@repo/ui/VisaLogo";
import SignInBoxComponent from "./SignInBoxComponent";
import { GalleryVerticalEnd } from "lucide-react";
export default function SignInComponent() {
  return (
    <>
      <div className="flex flex-col h-screen items-center justify-center md:mt-[35px]">
        <SignInBoxComponent />
      </div>
    </>
  );
}
