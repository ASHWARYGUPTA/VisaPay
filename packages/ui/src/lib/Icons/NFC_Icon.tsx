interface NFCIconInterface {
  height?: Number;
  width?: Number; // in pixels
}

export default function NFCIcon({ height, width }: NFCIconInterface) {
  return (
    <>
      <svg
        width={`${width ? width : 55}`}
        height={`${height ? height : 45}`}
        viewBox="0 0 70 55"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.5 20L25 40"
          stroke="#33363F"
          strokeWidth="1.792"
          strokeLinecap="round"
        />
        <path
          d="M46.806 51.25C50.5363 44.7893 52.5 37.4603 52.5 30C52.5 22.5397 50.5363 15.2108 46.806 8.75"
          stroke="#33363F"
          strokeWidth="1.792"
          strokeLinecap="round"
        />
        <path
          d="M35.9808 45C38.6138 40.4395 40 35.266 40 30C40 24.7339 38.6138 19.5606 35.9808 15"
          stroke="#33363F"
          strokeWidth="1.792"
          strokeLinecap="round"
        />
        <path
          d="M24.8205 40C26.5757 36.9595 27.5 33.5107 27.5 30C27.5 26.4893 26.5757 23.0404 24.8205 20"
          stroke="#33363F"
          strokeWidth="1.792"
          strokeLinecap="round"
        />
        <path
          d="M12.6795 40C10.9241 36.9595 10 33.5107 10 30C10 26.4893 10.9241 23.0404 12.6795 20"
          stroke="#33363F"
          strokeWidth="1.792"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}
