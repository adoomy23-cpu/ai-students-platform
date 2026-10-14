"use client";
import { createContext, useContext } from "react";
export const NavigationRoleContext = createContext("visitor");
export function useNavigationRoleContext() { return useContext(NavigationRoleContext); }
