"use client";
import NFCIcon from "./lib/Icons/NFC_Icon";
import SimCard from "./lib/Icons/Sim_Card";
import VisaLogoWhite from "./lib/Icons/Visa_Logo_White";
export default function VisaCard() {
  return (
    <>
      <div className="mb-2 border-2 h-[190px] w-[340px] md:w-[500px] md:h-[290px] rounded-3xl bg-gradient-to-br from-[#C8CFF3] to-[#1434CB] grid grid-cols-3 grid-rows-12 text-white shadow-lg hover:shadow-2xl hover:scale-102 transition-all duration-[1s] ease-in-out">
        <div className="row-span-4 col-span-3"></div>

        <div className="row-span-2 col-span-3 grid grid-cols-6">
          <div className="col-span-1"></div>
          <div className="pl-6 mr-0 col-span-3 flex">
            <div className="hidden md:block">
              <SimCard />
            </div>
            <div className="block md:hidden">
              <SimCard height={20} width={30} />
            </div>
            <div className="hidden md:block">
              <NFCIcon />
            </div>
            <div className="block md:hidden">
              <NFCIcon height={20} width={30} />
            </div>
          </div>
        </div>

        <div className="md:text-3xl row-span-2 col-span-3 bold">
          <span
            style={{ fontFamily: "Courier Prime, monospace" }}
            className="font-bold flex justify-center items-center h-full w-full"
          >
            0000 0000 0000 0000
          </span>
        </div>
        <div className="md:text-xl row-span-2 col-span-3 grid grid-cols-10 grid-rows-2">
          <div className="col-span-6 row-span-2 "></div>
          <div>
            <div
              style={{ fontFamily: "Courier Prime, monospace" }}
              className="row-span-1 font-bold flex justify-top items-top h-full w-full"
            >
              Expiry
            </div>
            <div
              style={{ fontFamily: "Courier Prime, monospace" }}
              className="md:text-xl row-span-1 font-bold flex justify-top items-top h-full w-full"
            >
              12/30
            </div>
          </div>
        </div>

        <div className="row-span-2 col-span-3 grid grid-cols-4 flex justify-between">
          <div className="md:text-xl ml-5 col-span-2 flex justify-center items-center pr-[70px]">
            <span
              style={{ fontFamily: "Courier Prime, monospace" }}
              className="font-bold"
            >
              Ashwary Gupta
            </span>
          </div>
          <div className="flex mr-5 justify-end col-span-2 items-center">
            <div className="hidden md:block">
              <VisaLogoWhite size="large" />
            </div>
            <div className="block md:hidden">
              <VisaLogoWhite size="small" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
