import React, { useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { auth, provider } from "../utils/firebase";
import { serverURI } from "../App";
import { signInWithPopup } from "firebase/auth";
import { setuserData } from "../redux/userSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleGoogleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoadingGoogle(true);
      const response = await signInWithPopup(auth, provider);

      let user = response.user;
      let name = user.displayName;
      let email = user.email;
      let googleId = user.uid;

      const result = await axios.post(
        serverURI + "/auth/user/google/register",
        {
          name,
          email,
          googleId,
        },
        {
          withCredentials: true,
        }
      );
      dispatch(setuserData(result.data));
      navigate("/home");
    } catch (err) {
      console.log("err register :-", err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoadingRegister(true);
      const response = await axios.post(
        serverURI + "/auth/user/register",
        {
          name,
          email,
          password,
        },
        {
          withCredentials: true,
        }
      );
      setError("");
      setMessage("Registration completed");

      navigate("/register/verify-otp", {
        state: {
          userId: response.data.user._id,
        },
      });

      dispatch(setuserData(response.data));
    } catch (err) {
      console.log("handleRegister err:-", err);
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Accent Lights */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-10">
        
        {/* Header & Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-2xl mb-4 shadow-inner">
            🍔
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Welcome to <span className="font-semibold text-orange-600">Yumzo</span>! Start ordering your favorite food.
          </p>
        </div>

        {/* Social Register */}
        <div className="mt-6">
          <button
            onClick={handleGoogleRegister}
            type="button"
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 transition-colors duration-200 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle size={20} />
            <span>
              {loadingGoogle ? "Connecting..." : "Continue with Google"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 tracking-wider">
              Or register with email
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={handleRegister}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Status Feedback */}
          {message && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700 text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loadingRegister}
            className="w-full group relative flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {loadingRegister ? "Creating account..." : "Create Account"}
            </span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-slate-600 pt-2">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login/user")}
            disabled={loadingLogin}
            className="font-semibold text-orange-600 hover:text-orange-500 transition-colors underline-offset-2 hover:underline disabled:opacity-50"
          >
            {loadingLogin ? "Loading..." : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;