import ReactDOM from "react-dom/client";
import "./base.css";

export function mountApp(App) {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
