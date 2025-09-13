import React from 'react'

import { register, login } from './services/api'
import { MyContext } from './MyContext'
import { useContext } from 'react'

const AuthPage = () => {

  const {email, setEmail, password, setPassword, auth, setAuth} = useContext(MyContext);

  async function handleRegister() {
    try {
      const res = await register({ email, password});
      console.log("Register response:", res);
      alert("User registered. Now login.");
    } catch (err) {
      console.error(err);
      alert("Register failed");
    }
  }

  async function handleLogin() {
    try {
      const res = await login({ email, password });
      console.log("Login response:", res);
      if (res.token && res.userId) {
        setAuth({"userId":res.userId,"token":res.token})
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Auth Page</h1>
      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded w-64"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded w-64"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex gap-4">
        <button
          onClick={handleRegister}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Register
        </button>
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  )
}

export default AuthPage