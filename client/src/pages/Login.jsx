import cover from "../assets/cover.PNG";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(""); // for error message

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = formData; // Extract email & password

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Login failed");
      }

      const data = await res.json(); // Get user data from server

      // Save logged-in user in localStorage
      localStorage.setItem("user", JSON.stringify(data));

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-screen bg-[linear-gradient(to_right,#ae6d4c,#7a4b49,#8b5559)] flex items-center justify-center font-sans">
      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          {error}
        </div>
      )}
      <div className="bg-gray-100 w-[50%] h-[70%] rounded-3xl shadow-lg flex items-center justify-between max-sm:flex-col max-sm:w-full max-sm:h-full max-sm:p-4 max-md:w-92 max-lg:w-92">
        {/* Left: Form */}
        <div className="flex flex-col items-start justify-center flex-1 text-center sm:justify-center pl-4 pt-0 pb-0">
          <h1 className="text-2xl font-bold mb-8 pl-12">Login</h1>
          <form className="flex flex-col gap-4 w-80 pl-12" onSubmit={handleSubmit}>
            <h1 className="text-sm font-semibold text-gray-800">Let's get started</h1>
            <input
              className="bg-white h-10 px-3 shadow-md rounded-md max-sm:w-52"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              name="email"
              required
            />
            <input
              className="bg-white h-10 px-3 shadow-md rounded-md max-sm:w-52"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              name="password"
              required
            />
            <input
              className="bg-[#976773] text-white font-medium shadow-md cursor-pointer hover:bg-[#845d66] h-10 rounded-lg max-sm:w-52"
              type="submit"
              value="Login"
            />
          </form>
          <p className="text-sm text-gray-500 pl-12 py-4">
            Don't have an account? <Link to="/register" className="text-[#845d66]">Sign Up</Link>
          </p>
        </div>

        {/* Right: Image */}
        <div className="flex justify-end pt-0 pb-0 pr-10 max-sm:hidden max-lg:hidden">
          <img
            className="w-[65%] h-[55%] object-cover rounded-3xl"
            src={cover}
            alt="cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
