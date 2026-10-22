import { createContext, useContext } from "react";

// The "notice board" that any component can read to learn who is logged in.
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}