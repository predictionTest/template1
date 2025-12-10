import { Theme } from '@mui/material/styles'
import { makeStyles } from 'tss-react/mui';


export const useStyles = makeStyles()((theme: Theme) => ({
  header: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
    position: 'absolute',
    zIndex: 1100,
    top: '0px',
    left: 'auto',
    right: '0px',
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(37, 40, 49)',
    borderStyle: 'solid',
    borderWidth: '0px 0px 1px',
    borderColor: 'rgb(69, 72, 81)',
    boxShadow: 'none',
    backgroundImage: 'unset',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
  },
  headerChain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginRight: 20,
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1) !important',
    borderRadius: 8,
  },
  headerChainImage: {
    width: 20,
    height: 20,
  },
  headerChainText: {
    margin: '0 0 0 8px',
  },
  headerDiv: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: '68px',
    padding: '16px 40px 16px 24px',
    boxShadow: 'none',
  },
  headerDivExchange: {
    flex: '1 0 auto',
    display: 'flex',
    fontSize: '20px',
    lineHeight: '28px',
    fontWeight: 600,
    color: 'rgb(255, 255, 255)',
    '@media (max-width: 767px)': {
      display: 'none',
    },
  },
  headerDivExchangeLink: {
    display: 'block',
    textDecoration: 'none',
    color: 'rgb(255, 255, 255)',
  },
  headerWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  headerWalletButton: {
    cursor: 'pointer',
    borderRadius: '8px',
    padding: '8px 16px 9px',
    fontSize: '14px',
    lineHeight: '19px',
    fontWeight: 500,
    fontFamily: 'Manrope, Poppins, Inter, PingFangSC-Regular, "Microsoft YaHei", sans-serif',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.1) !important',
    display: 'flex',
    alignItems: 'center',
  },
  headerWalletButtonDiv: {
    color: "#fff",
    maxWidth: 'max-content',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerWalletButtonImg: {
    width: '16px',
    height: '16px',
    marginRight: '4px',
    marginLeft: '0px !important',
  },
  wrapper: {
    display: 'flex',
    position: 'relative',
    backgroundColor: '#30333c',
    height: '100vh',
    overflow: 'hidden',
  },
  mainBack: {
    position: 'relative',
    backgroundColor: 'rgb(37, 40, 49)',
    backgroundImage: 'url(/src/assets/img/bg2.jpg)',
    width: '100%',
    flex: '1 1 0%',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0px',
    height: '100%',

  },
  main: {
    flex: '1 1 0%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  main2: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0%',
    position: 'relative',
    overflow: 'hidden',
    overflowX: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: '1 1 0%',
  },
  contentH: {
    height: '68px',
  },
  cMain1: {
    height: '100%',
    overflowY: 'auto',
    marginTop: '3em',
    marginBottom: '3em',
    position: 'relative',
    zIndex: 1,
    minHeight: '43em',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column-reverse',
    marginLeft: '68px',
    marginRight: '68px',
  },
  batman: {
    width: '100%',
    height: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: '450px',
    position: 'relative',
    top: 'auto',
  },
  button64: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Phantomsans, sans-serif',
    fontSize: '20px',
    lineHeight: '1em',
    borderRadius: '8px',
    padding: '3px',
    textDecoration: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    backgroundColor: '#AF40FF',
    backgroundImage: 'linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB)',
    border: '0',
    boxShadow: 'rgba(151, 65, 252, 0.2) 0 15px 30px -5px',
    color: '#FFFFFF',
    maxWidth: '100%',
    minWidth: '140px',
    '&:active, &:hover': {
      outline: '0',
      '& span': {
        background: 'none',
      },
    },
    [theme.breakpoints.up('sm')]: {
      fontSize: '24px',
      minWidth: '196px',
    },
  },
  span: {
    backgroundColor: '#262e58;',
    padding: '16px 24px',
    borderRadius: '6px',
    width: '100%',
    height: '100%',
    transition: '300ms',
  },
  buttonContainer: {
    marginTop: '16px',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ex1: {
    marginTop: 28
  },
  ex2: {
    backgroundColor: '#30333c',
    color: 'rgb(255, 255, 255)',
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    border: '1px solid rgb(69, 72, 81)',
    '&:hover': {
      boxShadow: 'your-hover-box-shadow',
    },
    overflow: 'hidden',
    borderRadius: '16px',
    paddingBottom: 20
  },
  ex3: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    marginTop: 20,
    minWidth: '100px',
    width: '43%',
  },
  errorR: {
    display: 'flex',
    textAlign: "center",
    marginTop: '16px',
    flexGrow: 1,
    marginRight: 5,
    marginLeft: 5,
    overflowWrap: "anywhere",
    '@media (max-width: 767px)': {
      fontSize: 12
    },
  },
  price: {
    display: 'flex',
    flexDirection: "column",
    alignItems: 'center',
    color: "white",
    marginTop: 10,
    marginLeft: 10

  },
  svg: {
    position:"absolute",
    width:0,
    height:0
  },
  textPrice: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    fontFamily: 'Arial Black, sans-serif',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    filter: 'url(#filter)', // Apply the filter here
    outline: 'none',
    background: 'linear-gradient(144deg, #AF40FF, #5B42F3 50%, #00DDEB)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text', // For Safari and older versions of Chrome
    color: "transparent",
    fontSize: '3vw', // Adding font size
    lineHeight: '2', 
    '@media (max-width: 767px)': {
      fontSize: '5vw',
      lineHeight: '2', 
    },
  },
  fx: {
    display: 'flex',
    alignItems: 'center',
    // marginRight: '1em',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    marginLeft: '98%',
    marginRight: '0px',
  },
  fx1: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '1em',
  },
  item3: {
    marginTop: '1rem',
    marginBottom: '1rem',
    position: 'relative',
    // '&:after': {
    //   content: 'attr(data-title)',
    //   position: 'absolute',
    //   top: '100px',
    //   left: 0,
    //   width: '300px',
    //   background: 'rgb(4, 66, 87)',
    //   borderRadius: '30px',
    //   padding: '14px 20px',
    //   opacity: 0,
    //   transform: 'translateY(-20px)',
    //   transition: '0.34s linear',
    //   color: '#fff',
    //   boxShadow: '0 5px 12px #ccc',
    //   pointerEvents: 'none',
    // },
    // '&:hover:after': {
    //   opacity: 1,
    //   transform: 'translateY(0)',
    // },
  },
  tooltipContent: {
    background: 'rgba(4, 66, 87, 0)', // Transparent background with opacity 0
    color: '#fff',
  },



}))



