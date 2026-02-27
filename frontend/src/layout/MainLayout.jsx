import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="content-area">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
