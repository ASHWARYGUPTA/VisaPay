"use client";
import React, { JSX, ReactElement, ReactHTMLElement, useState } from "react";
import Button from "./Button";
import MenuButton from "./MenuButton";
import VisaLogo from "./VisaLogo";

interface NavBarExtras {
  moodChanger?: React.ElementType;
}

export default function NavBar({ moodChanger }: NavBarExtras) {
  const [p, useP] = useState(false);
  return (
    <>
      <div className="h-auto mt-2 w-svw mx-1 bg-[#ffffff7e] rounded-xl fixed top-0 left-0">
        <div className=" h-[65px]   flex items-center justify-between font-poppins ">
          <div>
            <div className="pt-[120px] sm:hidden">
              <VisaLogo heightN={100} widthN={100} />
            </div>
            <div className="invisible sm:visible">
              <VisaLogo heightN={120} widthN={120} />
            </div>
          </div>

          <div className="flex justify-between items-center mr-4">
            <div className="">
              {moodChanger ? React.createElement(moodChanger) : null}
            </div>
            <div className="invisible sm:visible flex justify-between items-center">
              <Button>Sign In</Button>
              <Button>Sign Up</Button>
            </div>
            <div className="absolute right-4  sm:hidden">
              <MenuButton
                f={() => {
                  useP((p) => !p);
                }}
              />
            </div>
          </div>
        </div>
        <div className={`mt-2  ${!p ? "hidden" : ""}`}>
          <Button>Login</Button>
          <Button>Login</Button>
        </div>
      </div>
    </>
  );
}
