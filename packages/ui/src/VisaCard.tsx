"use client";
import NFCIcon from "./lib/Icons/NFC_Icon";
import SimCard from "./lib/Icons/Sim_Card";
import VisaLogoWhite from "./lib/Icons/Visa_Logo_White";

interface VisaCardInterface {
  heightOfCard?: string | number;
  widthOfCard?: string | number;
}

export default function VisaCard({
  heightOfCard,
  widthOfCard,
}: VisaCardInterface) {
  return (
    <div
      style={{
        height: heightOfCard ? `${heightOfCard}px` : "290px",
        width: widthOfCard ? `${widthOfCard}px` : "500px",
      }}
      className="mb-2 border-2 rounded-3xl bg-gradient-to-br from-[#C8CFF3] to-[#1434CB] grid grid-cols-3 grid-rows-12 text-white shadow-lg hover:shadow-2xl hover:scale-102 transition-all duration-[1s] ease-in-out"
    >
      {/* Top spacing */}
      <div className="row-span-4 col-span-3"></div>

      {/* SIM + NFC */}
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

      {/* Card Number */}
      <div className="md:text-3xl row-span-2 col-span-3 bold">
        <span
          style={{ fontFamily: "Courier Prime, monospace" }}
          className="font-bold flex justify-center items-center h-full w-full"
        >
          0000 0000 0000 0000
        </span>
      </div>

      {/* Expiry */}
      <div className="md:text-xl row-span-2 col-span-3 grid grid-cols-10 grid-rows-2">
        <div className="col-span-6 row-span-2"></div>
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

      {/* Name + Visa logo */}
      <div className="row-span-2 col-span-3 grid grid-cols-4 flex justify-between">
        <div className="text-sm md:text-xl md:ml-5 col-span-2 flex justify-center items-center md:pr-[70px]">
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
  );
}
