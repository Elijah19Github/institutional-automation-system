function Sidebar() {
  const role = localStorage.getItem("role");

  return (
    <aside className="sidebar">
      <h2 className="logo">Institution System</h2>

      <nav>
        <a href="/">Dashboard</a>

        {role !== "STUDENT" && <a href="/attendance">Attendance</a>}
        {role !== "STUDENT" && <a href="/risk">Risk Analytics</a>}
        {role !== "STUDENT" && <a href="/notifications">Notifications</a>}

        <a href="/settings">Settings</a>
        <a href="/logout">Logout</a>
      </nav>
    </aside>
  );
}

export default Sidebar;
