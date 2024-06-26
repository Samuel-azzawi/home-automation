import { useNavigate } from "react-router-dom";
import { MdOutlineOtherHouses } from "react-icons/md";
import { GoGraph } from "react-icons/go";
import { FcAbout } from "react-icons/fc";
import { PiSignOutDuotone } from "react-icons/pi";
import "../css/Toolbar.css";
import signOut from "../../firebase/auth_signout";
import { useData } from "../DataContext";

function Toolbar() {
  const { clearData } = useData();
  let navigate = useNavigate();
  const navigateTo = (path) => {
    navigate(path);
  };
  const handleSignOut = () => {
    signOut().then(() => {
      clearData();
    });
  };
  return (
    <div className="toolbar">
      <button className={`button-16`} onClick={() => navigateTo("/")}>
        <span className="text">
          <MdOutlineOtherHouses className="logo" />
          <p>Home</p>
        </span>
      </button>
      <button className={`button-16`} onClick={() => navigateTo("/Graphs")}>
        <span className="text">
          <GoGraph className="logo" />
          <p>Graphs</p>
        </span>
      </button>
      <button className={`button-16`} onClick={() => navigateTo("/About")}>
        <span className="text">
          <FcAbout className="logo" />
          <p>About</p>
        </span>
      </button>
      <button className="button-16 signout" onClick={handleSignOut}>
        <span className="text">
          <PiSignOutDuotone className="logo" />
          <p>Log Out</p>
        </span>
      </button>
    </div>
  );
}

export default Toolbar;
