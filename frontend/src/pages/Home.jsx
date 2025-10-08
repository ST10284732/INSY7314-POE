import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Banking App</h1>
      <p>
        <Link to="/login">
          <button>Login</button>
        </Link>
      </p>
      <p>
        <Link to="/register">
          <button>Register</button>
        </Link>
      </p>
    </div>
  );
}