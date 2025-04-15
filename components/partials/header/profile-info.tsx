import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";

const ProfileInfo = () => {
  // Fetch user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const router = useRouter();

  // Fallback data if user is not found in localStorage
  const fallbackUser = {
    id: "67a8f61bad19ec497b51874a",
    name: "CEO",
    email: "admin@academix.com",
    role: "admin",
    image: "https://placehold.co/600x400", // Dummy avatar
    username: "admin", // Fallback username
  };

  // Merge localStorage data with fallback data
  const userData = { ...fallbackUser, ...user };

  // Get logout function from the store
  const logout = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    await fetch("/api/auth/removeToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    // Redirect to login page
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <div className="flex items-center">
          {userData.image && (
            <Image
              src={userData.image}
              alt={user.full_name}
              width={36}
              height={36}
              className="rounded-full"
            />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
          {userData.image && (
            <Image
              src={userData.image}
              alt={user.full_name}
              width={40}
              height={10}
              className="rounded-lg"
            />
          )}
          <div>
            <div className="text-sm font-medium text-default-800 capitalize">
              {user.full_name}
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-default-600 hover:text-primary"
            >
              {user.email}
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {[
            {
              name: "Profile",
              icon: "heroicons:user",
              href: "/user-profile",
            },
            {
              name: "Billing",
              icon: "heroicons:megaphone",
              href: "/dashboard",
            },
            {
              name: "Settings",
              icon: "heroicons:paper-airplane",
              href: "/dashboard",
            },
          ].map((item, index) => (
            <Link
              href={item.href}
              key={`info-menu-${index}`}
              className="cursor-pointer"
            >
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
                <Icon icon={item.icon} className="w-4 h-4" />
                {item.name}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={logout} // Call the logout function
          className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize my-1 px-3 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileInfo;
