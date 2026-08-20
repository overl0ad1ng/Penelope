import cn from "classnames";
import "./MenuIcon.css";

type MenuIconProps = {
  className?: string;
};

const MenuIcon = ({ className }: MenuIconProps) => {
  return (
    <i className={cn("MenuIcon", className)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="m 0 2 h 20 M 0 10 h 20 M 0 18 h 20 " />
      </svg>
    </i>
  );
};

export default MenuIcon;
