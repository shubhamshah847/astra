import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { serverURI } from "../App";
import { setuserData } from "../redux/userSlice";

const Login = () => {
  const [Loginloading, setLoginloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [Message, setMessage] = useState("");
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    setMessage("");
    e.preventDefault();
    setLoginloading(true);
    setIsSuccess(false);

    try {
      const response = await axios.post(
        serverURI + "/auth/user/login",
        { email, password },
        { withCredentials: true }
      );
      
      dispatch(setuserData(response.data));
      console.log("resonse - login:-", response);

      setMessage(response.data.message || "login successfully");
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/home");
      }, 1100);
    } catch (err) {
      console.log("login api err :", err);
      setMessage(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoginloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Accent Lights */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-10 relative overflow-hidden">
        
        {/* Animated Login Overlay */}
        {(Loginloading || isSuccess) && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
            {isSuccess ? (
              <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                  <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-800 font-semibold text-lg">{Message}</p>
                <p className="text-slate-400 text-xs mt-1">Redirecting to home...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in fade-in duration-200">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-700 font-medium text-sm">Authenticating...</p>
              </div>
            )}
          </div>
        )}

        {/* Header & Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-2xl mb-4 shadow-inner">
            🍴
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Login to continue ordering from <span className="font-semibold text-orange-600">Yumzo</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-orange-600 hover:text-orange-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Error Feedback */}
          {Message && !isSuccess && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 text-center">
              {Message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={Loginloading}
            className="w-full group relative flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{Loginloading ? "Waiting for response..." : "Login"}</span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-2 text-center space-y-4">
          <p className="text-sm text-slate-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register/user")}
              className="font-semibold text-orange-600 hover:text-orange-500 transition-colors underline-offset-2 hover:underline"
            >
              Sign Up
            </button>
          </p>

          <p className="text-xs text-slate-400">
            © 2026 Yumzo · Developed by Shubham Shah
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;