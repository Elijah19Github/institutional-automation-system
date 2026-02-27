function Navbar() {
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");

  return (
    <header className="navbar">
      <span>Role: {role}</span>
      <span>{name}</span>
    </header>
  );
}

export default Navbar;
