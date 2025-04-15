import Header from "./components/header";
export const metadata = {
  title: "User Profile",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default Layout;
