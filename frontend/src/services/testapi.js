import { register, login } from "./api.js";

async function test() {
  const r = await register({
    email: "test2@example.com",
    password: "123456",
  });
  console.log("Register:", r);

  const l = await login({ email: "test1@example.com", password: "123456" });
  console.log("Login:", l);
}
test();