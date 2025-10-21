import { User } from "@/lib/type";

const useAuthrization = ({ user, module }: { user: User; module: string }) => {
  return (
    user?.modules?.some((item) => {
      return item.access === true && item.name.toLowerCase() === module.toLowerCase();
    })
  );
};

export default useAuthrization;