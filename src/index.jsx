import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import theme from "./theme/theme";
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
