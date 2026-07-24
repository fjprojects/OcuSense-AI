import "./SplashScreen.css";
import splashImage from "../assets/ocusense-splash.png";

function SplashScreen() {
  return (
    <div className="splash-screen">
      <img
        src={splashImage}
        alt="Ocusense Arena"
        className="splash-image"
      />
    </div>
  );
}

export default SplashScreen;