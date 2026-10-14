"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccess } from "../platform/AuthProvider";
import { canAccessStudent, studentDestination } from "../../lib/student/profile.mjs";

// Navigation follows the provider's current verified session. A second login
// check must not race this state or turn an unresolved profile into 'pending'.
export function useStudentAccountRedirect({ approvedOnly = false } = {}) {
  const access = useAccess();
  const router = useRouter();
  const pathname = usePathname();
  const destination = studentDestination(access);
  const mayRedirect = access.status === "authenticated" && (!approvedOnly || canAccessStudent(access));
  useEffect(() => {
    if (mayRedirect && destination && pathname !== destination) router.replace(destination);
  }, [mayRedirect, destination, pathname, router]);
  return access;
}
