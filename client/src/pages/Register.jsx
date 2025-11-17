import { Link } from "react-router-dom";
import cover from "../assets/cover.PNG";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
export const Register = () => {
  // for form submission
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [success, setSuccess] = useState(""); // for success message
  const [error, setError] = useState(""); // optional, for error message

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "member" }),
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok) {
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        setSuccess(result.message);
        setError("");
        setFormData({ username: "", email: "", password: "" });

        // Optionally redirect to Dashboard after 2 seconds
        setTimeout(() => {
          setSuccess("");
          navigate("/dashboard"); // adjust path if needed
        }, 2000);
      } else {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="h-screen w-screen bg-[linear-gradient(to_right,#ae6d4c,#7a4b49,#8b5559)] flex items-center justify-center max-lg:flex max-lg:justify-center font-sans relative">

      {/* Success Message */}
      {success && (
        <div className="absolute top-4 right-4 bg-gray-100 text-[#976773] px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          {error}
        </div>
      )}

      <div className="bg-gray-100 w-[50%] h-[80%] rounded-3xl shadow-lg flex items-center justify-between px-0 max-sm:flex-col max-sm:w-full max-sm:h-full max-sm:p-4 max-md:w-92 max-lg:w-92">

        {/* Left: Form Section */}
        <div className="flex flex-col items-start justify-center flex-1 text-center place-items-center sm:justify-center pl-2 pt-0 pb-0">
          <div className='flex justify-center text-center w-76 pb-10'>
            <h1 className="text-2xl flex max-sm:flex max-sm:flex-row text-center font-20px pl-2">
              Create an account
            </h1>
          </div>

          <form className="flex flex-col gap-4 w-80 pl-12" onSubmit={handleSubmit}>
            <div className='flex justify-items-start w-70'>
              <h1 className="text-sm font-semibold flex flex-row justify-items-start text-start font-20px text-gray-800">
                Let's get started
              </h1>
            </div>
            <input
              className="bg-white h-10 px-3 shadow-md rounded-md max-sm:w-52"
              type="text"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              className="bg-white h-10 px-3 shadow-md rounded-md max-sm:w-52"
              type="text"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              className="bg-white h-10 px-3 shadow-md rounded-md max-sm:w-52"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              className="bg-[#976773] text-white font-medium shadow-md cursor-pointer hover:bg-[#845d66] h-10 rounded-lg max-sm:w-52"
              type="submit"
              value="Register"
            />
          </form>

          <div className='flex pl-12 py-4'>
            <p className='text-sm text-gray-500'>
              Already have an account? <Link to="/" className='text-[#845d66]'>Login</Link>
            </p>
          </div>

          <div className="flex justify-center pl-18">
            <button className="flex items-center gap-2 bg-white text-gray-700 rounded-lg shadow px-4 py-2 hover:bg-gray-100">
              <FcGoogle className="text-2xl" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>

        {/* Right: Image Section */}
        <div className="flex justify-end pt-0 pb-0 pr-10 max-sm:hidden max-lg:hidden">
          <img
            className="w-[75%] h-[65%] object-cover rounded-3xl"
            src={cover}
            alt="cover"
          />
        </div>

      </div>
    </div>
  )
}

export default Register;
