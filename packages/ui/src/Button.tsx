enum ButtonTypes {
  blueNormal = "blue",
  danger = "red",
  greenNormal = "green",
}
interface ButtonProps {
  type: ButtonTypes;
}

export default function Button({
  children,
  type = ButtonTypes.blueNormal,
}: {
  children: React.ReactNode;
  type?: ButtonTypes;
}) {
  let colorClass = "";
  switch (type) {
    case ButtonTypes.danger:
      colorClass = "bg-red-500";
      break;
    case ButtonTypes.greenNormal:
      colorClass = "bg-green-500";
      break;
    default:
      colorClass = "bg-blue-500";
  }
  return (
    <div
      className={`ml-3 mr-2 p-2 h-[45px] w-[100px] border-2 flex items-center justify-center rounded-xl ${colorClass}`}
    >
      <button className="text-[20px] text-amber-50 cursor-pointer ">
        {children}
      </button>
    </div>
  );
}
