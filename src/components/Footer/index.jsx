
import { Link } from "react-router-dom";

import "./footer.css";

import { swap, earn, translate, referral, bgwhref } from "../../assets/img";

const Footer = ({ page, setModal, t }) => {
  return (
    <footer className="footer  mui-style-z52qd3">
      <div className="MuiToolbar-root MuiToolbar-gutters MuiToolbar-regular mui-style-1uhepq3">
        <Link to="/exchange" className="active MuiBox-root mui-style-cd771o">
          <div className="icon-wrapper MuiBox-root mui-style-1972y4e">
            <div className="MuiBox-root mui-style-0">
              <img
                src={swap}
                alt="swap"
                className={
                  page === "exchange"
                    ? "bg-swap MuiBox-root mui-style-0"
                    : "none"
                }
              />
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                className={
                  page === "exchange" ? "none" : "MuiBox-root mui-style-0"
                }
              >
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g transform="translate(-1415.000000, -228.000000)">
                    <g
                      id="ICON/swap_24dp"
                      transform="translate(1415.000000, 228.000000)"
                    >
                      <rect x="0" y="0" width="24" height="24"></rect>
                      <path
                        d="M8,11 L8,13 L14,13 L14,18 L8,18 L8,20 L2,15.5 L8,11 Z M16,4 L22,8.5 L16,13 L16,11 L10,11 L10,6 L16,6 L16,4 Z"
                        fill="currentColor"
                      ></path>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <span>{"exchange"}</span>
        </Link>
        <div className="MuiBox-root mui-style-cd771o none">
          <div className="icon-wrapper MuiBox-root mui-style-1972y4e">
            <div className="MuiBox-root mui-style-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="MuiBox-root mui-style-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3 4.5C3 3.67157 3.67157 3 4.5 3H9.5C10.3284 3 11 3.67157 11 4.5V8.49021L10.1895 9.3007H5.5V14.3007H10.1897L11 15.1111V19.5C11 20.3284 10.3284 21 9.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5ZM13 17.1112V19.5C13 20.3284 13.6716 21 14.5 21H19.5C20.3284 21 21 20.3284 21 19.5V4.5C21 3.67157 20.3284 3 19.5 3H14.5C13.6716 3 13 3.67157 13 4.5V6.49021L13.6116 5.87866L19.5336 11.8007L13.6115 17.7227L13 17.1112Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M17.4123 11.8007L13.6116 8L12.1973 9.41421L13.5838 10.8007H7V12.8007H13.5838L12.1973 14.1871L13.6115 15.6014L17.4123 11.8007Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </div>
          <span> {"bridge"}</span>
        </div>
        <Link className="MuiBox-root mui-style-cd771o" to="/earn">
          <div className="icon-wrapper MuiBox-root mui-style-1972y4e">
            <div className="MuiBox-root mui-style-0">
              <img
                src={earn}
                alt="earn"
                className={
                  page === "earn" ? "bg-swap MuiBox-root mui-style-0" : "none"
                }
              />
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                className={page === "earn" ? "none" : "MuiBox-root mui-style-0"}
              >
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g transform="translate(-1489.000000, -230.000000)">
                    <g
                      id="ICON/earn_24dp"
                      transform="translate(1489.000000, 230.000000)"
                    >
                      <polygon points="0 0 24 0 24 24 0 24"></polygon>
                      <path
                        d="M19.83,8.5 L17.56,6.23 C17.63,5.81 17.74,5.42 17.88,5.08 C17.96,4.9 18,4.71 18,4.5 C18,3.67 17.33,3 16.5,3 C14.86,3 13.41,3.79 12.5,5 L7.5,5 C4.46,5 2,7.46 2,10.5 C2,13.54 4.5,22 4.5,22 L10,22 L10,20 L12,20 L12,22 L17.5,22 L19.18,16.41 L22,15.47 L22,8.5 L19.83,8.5 Z M13,10 L8,10 L8,8 L13,8 L13,10 Z M16,12 C15.45,12 15,11.55 15,11 C15,10.45 15.45,10 16,10 C16.55,10 17,10.45 17,11 C17,11.55 16.55,12 16,12 Z"
                        fill="currentColor"
                        fillRule="nonzero"
                      ></path>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <span>{"earn"}</span>
        </Link>
        <div className="MuiBox-root mui-style-cd771o none">
          <div className="icon-wrapper MuiBox-root mui-style-1972y4e">
            <div className="MuiBox-root mui-style-0">
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                className="MuiBox-root mui-style-0"
              >
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g transform="translate(-1551.000000, -230.000000)">
                    <g
                      id="ICON/crowdpooling_24dp"
                      transform="translate(1551.000000, 230.000000)"
                    >
                      <polygon points="0 0 24 0 24 24 0 24"></polygon>
                      <path
                        d="M11.99,2 C6.47,2 1.99,6.48 1.99,12 C1.99,17.52 6.47,22 11.99,22 C17.51,22 21.99,17.52 21.99,12 C21.99,6.48 17.51,2 11.99,2 Z M15.6,8.34 C16.67,8.34 17.53,9.2 17.53,10.27 C17.53,11.34 16.67,12.2 15.6,12.2 C14.53,12.2 13.67,11.34 13.67,10.27 C13.66,9.2 14.53,8.34 15.6,8.34 L15.6,8.34 Z M9.6,6.76 C10.9,6.76 11.96,7.82 11.96,9.12 C11.96,10.42 10.9,11.48 9.6,11.48 C8.3,11.48 7.24,10.42 7.24,9.12 C7.24,7.81 8.29,6.76 9.6,6.76 Z M9.6,15.89 L9.6,19.64 C7.2,18.89 5.3,17.04 4.46,14.68 C5.51,13.56 8.13,12.99 9.6,12.99 C10.13,12.99 10.8,13.07 11.5,13.21 C9.86,14.08 9.6,15.23 9.6,15.89 Z M11.99,20 C11.72,20 11.46,19.99 11.2,19.96 L11.2,15.89 C11.2,14.47 14.14,13.76 15.6,13.76 C16.67,13.76 18.52,14.15 19.44,14.91 C18.27,17.88 15.38,20 11.99,20 L11.99,20 Z"
                        fill="currentColor"
                        fillRule="nonzero"
                      ></path>
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <span> {"crowdpooling"}</span>
        </div>
        <Link className="MuiBox-root mui-style-cd771o" to="/referralZone">
          <div className="icon-wrapper MuiBox-root mui-style-1972y4e">
            <div className="MuiBox-root mui-style-0">
              <img
                src={referral}
                alt="refzone"
                className={
                  page === "referralZone" ? "bg-swap MuiBox-root mui-style-0" : "none"
                }
              />
                            <img
                src={bgwhref}
                alt="refzone"
                className={
                  page !== "referralZone" ? "MuiBox-root mui-style-0" : "none"
                }
              />
            </div>
          </div>
          <span>{"referral_zone"}</span>
        </Link>
        <div
          onClick={() => setModal(true)}
          className="MuiBox-root mui-style-cd771o translate-div-footer"
        >
          <button>
            <div>
              {" "}
              <img src={translate} alt="translate" />
            </div>
          </button>
          <span>Translate</span>
        </div>
      </div>
      <div className="MuiBox-root mui-style-0"></div>
    </footer>
  );
};

export default Footer;
