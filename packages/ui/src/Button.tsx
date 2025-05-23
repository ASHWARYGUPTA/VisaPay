import "./styles.css";

enum ButtonTypes {
  blueNormal = "blue",
  danger = "red",
  greenNormal = "green",
}
interface ButtonProps {
  type: ButtonTypes;
}

export default function Button({ children }: { children: React.ReactNode }) {
  let blueButtonTCSS = "bg-blue-500";
  return (
    <>
      <div
        className={
          `ml-3 mr-2 p-2 h-[45px] w-[100px] border-2  flex items-center justify-center rounded-xl ` +
          blueButtonTCSS
        }
      >
        <div>
          <button className="text-[20px] text-amber-50 cursor-pointer ">
            {children}
          </button>
        </div>
      </div>
    </>
  );
}
