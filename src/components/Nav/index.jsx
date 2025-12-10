import { useEffect } from "react";

import { Link } from "react-router-dom";

// Unused imports commented out
// import {
//   swap,
//   bgwhref,
//   bridge,
//   earn,
//   crowd,
//   starter,
//   help,
//   docs,
//   announcements,
//   home,
//   github,
//   twitter,
//   discord,
//   telegram,
//   medium,
//   translate,
//   referral,
//   lang,
// } from "../../assets/img";
import { useSwitchNetwork, useNetwork, sepolia } from "wagmi";
import photo1 from "../../assets/img/photo1.jpg"

const Nav = ({ page }) => {
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork();


  useEffect(() => {
    if (chain) {
      if (chain?.id !== sepolia.id) switchNetwork?.(sepolia.id)
    }
  }, [chain])

  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="nav-logo">
          <button className="nav-button nohover">
            <img
              src={photo1}
              alt="logo" />
          </button>
        </div>
        <ul className="nav-ul">
          <Link to="/" className="ul-3">
            {page === "Dashboard"
              ? <li className="ul-2">
                <div className="ul-2-div">
                  <a className="ul-2-a active">
                    <i className="fa-solid fa-chart-line"></i>
                    {"Dashboard"}
                  </a>
                </div>
              </li>
              : <div className="ul-3-div">
                <a className="ul-3-a">
                  <i className="fa-solid fa-chart-line"></i>
                  {"Dashboard"}
                </a>
              </div>}
          </Link>

          <Link to="/buy" className="ul-3">
            {page === "Buy NFTs"
              ? <li className="ul-2">
                <div className="ul-2-div">
                  <a className="ul-2-a active">
                    <i className="fa-solid fa-shopping-cart"></i>
                    {"Buy NFTs"}
                  </a>
                </div>
              </li>
              : <div className="ul-3-div">
                <a className="ul-3-a">
                  <i className="fa-solid fa-shopping-cart"></i>
                  {"Buy NFTs"}
                </a>
              </div>}
          </Link>

          <Link to="/staking" className="ul-3">
            {page === "Staking"
              ? <li className="ul-2">
                <div className="ul-2-div">
                  <a className="ul-2-a active">
                    <i className="fa-solid fa-lock"></i>
                    {"Staking"}
                  </a>
                </div>
              </li>
              : <div className="ul-3-div">
                <a className="ul-3-a">
                  <i className="fa-solid fa-lock"></i>
                  {"Staking"}
                </a>
              </div>}
          </Link>

          <Link to="/rewards" className="ul-3">
            {page === "Rewards"
              ? <li className="ul-2">
                <div className="ul-2-div">
                  <a className="ul-2-a active">
                    <i className="fa-solid fa-gift"></i>
                    {"Rewards"}
                  </a>
                </div>
              </li>
              : <div className="ul-3-div">
                <a className="ul-3-a">
                  <i className="fa-solid fa-gift"></i>
                  {"Rewards"}
                </a>
              </div>}
          </Link>

          <Link to="/analytics" className="ul-3">
            {page === "Analytics"
              ? <li className="ul-2">
                <div className="ul-2-div">
                  <a className="ul-2-a active">
                    <i className="fa-solid fa-chart-bar"></i>
                    {"Analytics"}
                  </a>
                </div>
              </li>
              : <div className="ul-3-div">
                <a className="ul-3-a">
                  <i className="fa-solid fa-chart-bar"></i>
                  {"Analytics"}
                </a>
              </div>}
          </Link>
        </ul>
        {/* Social links - Update with your project links */}
        {/* <ul className="docs-ul">
          <a className="docs-a" href="#" target="_blank">
            <img className="mr-8" src={docs} alt="docs" />
            {"docs"}
          </a>
          <a className="docs-a" onClick={() => setModal(true)}>
            <img className="mr-8" src={lang} alt="lang" />
            {"language"}
          </a>
        </ul>
        <div className="social-div">
          <div>
            <a className="social-a" href="#" target="_blank">
              <i className="fa-solid fa-house"></i>
            </a>
          </div>
          <div>
            <a className="social-a" href="#" target="_blank">
              <i className="fa-brands fa-twitter"></i>
            </a>
          </div>
          <div>
            <a href="#" target="_blank" className="social-a">
              <i className="fa-brands fa-discord"></i>
            </a>
          </div>
          <div>
            <a className="social-a" href="#" target="_blank">
              <i className="fa-brands fa-telegram"></i>
            </a>
          </div>
          <div>
            <a className="social-a" href="#" target="_blank">
              <i className="fa-brands fa-medium"></i>
            </a>
          </div>
        </div> */}
      </div>
    </nav>
  );
};
export default Nav;
