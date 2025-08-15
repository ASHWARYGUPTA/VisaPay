"use client";

export default function DashboardComponent() {
  return (
    <>
      <div className="h-svh w-svw">
        <div className="h-svh w-svw flex flex-col items-center pt-[100px] ">
          <div
            className={`text-[50px] md:w-[800px] mb-2 text-center font-bold md:text-[70px] $`}
            style={{
              letterSpacing: "-0.07em",
              lineHeight: "98.5%",
            }}
          >
            Welcome to Dashboard
          </div>

          <div
            className={`text-[50px] md:w-[800px] mb-2 text-center font-bold md:text-[30px] md:mt-[30px] $`}
            style={{
              letterSpacing: "-0.07em",
              lineHeight: "98.5%",
            }}
          >
            Make Payments
          </div>
          <div className="mt-5 w-[60%] rounded-[30px] h-svh bg-[#ffffffa7] grid grid-rows-10 grid-cols-3">
            <div className="row-span-2 flex flex-col justify-center items-center col-span-1 ">
              <div className="text-xl font-bold">Your Current Balance: </div>
              <div>123123123123</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
